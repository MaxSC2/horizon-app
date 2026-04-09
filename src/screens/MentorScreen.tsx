// src/screens/MentorScreen.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Modal, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Sparkles, Settings, Trash2, RotateCcw, Calendar,
  Lightbulb, ChevronRight, X, AlertTriangle, Check,
  MessageSquare, TrendingUp,
} from 'lucide-react-native';
import { useApp } from '../AppContext';
import { Card, Btn, Lbl } from '../components';
import { buildAIContext, calcStreak, getPRs } from '../helpers';
import { AI_PROVIDERS, QUICK_PROMPTS } from '../data';
import { ChatMessage, AIConfig } from '../types';

const PLAN_PROMPT = `Составь персональный план тренировок на следующую неделю. Формат: день — тренировка — упражнения — комментарий.`;

async function callAI(messages: ChatMessage[], systemPrompt: string, aiConfig: AIConfig): Promise<string> {
  const cfg = aiConfig || {};
  const prov = AI_PROVIDERS.find(p => p.id === cfg.provider) || AI_PROVIDERS[0];
  const model = cfg.model || prov.defaultModel;
  const fullSys = systemPrompt + (cfg.persona ? `\n\nПерсонаж: ${cfg.persona}` : '') + (cfg.systemExtra ? `\n\n${cfg.systemExtra}` : '');

  if (prov.id === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 1400, system: fullSys, messages: messages.slice(-20).map(m => ({ role: m.role, content: m.content })) }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `HTTP ${res.status}`); }
    const data = await res.json();
    return data.content?.find((b: any) => b.type === 'text')?.text || 'Нет ответа';
  }

  if (prov.id === 'gemini') {
    if (!cfg.apiKey) throw new Error('Не указан API ключ Gemini.\n\nПолучи: aistudio.google.com → Get API key');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.apiKey}`;
    const contents = messages.slice(-20).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: fullSys }] }, contents, generationConfig: { maxOutputTokens: 1400 } }) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `HTTP ${res.status}`); }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Нет ответа';
  }

  let endpoint = '';
  if (prov.id === 'openai') endpoint = 'https://api.openai.com/v1/chat/completions';
  else if (prov.id === 'groq') endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  else endpoint = cfg.endpoint || '';

  if (!endpoint) throw new Error('Не указан endpoint для провайдера');
  if (prov.needsKey && !cfg.apiKey) throw new Error(`Не указан API ключ ${prov.name}.\n\n${prov.hint || ''}`);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`;

  const res = await fetch(endpoint, {
    method: 'POST', headers,
    body: JSON.stringify({ model, max_tokens: 1400, messages: [{ role: 'system', content: fullSys }, ...messages.slice(-20).map(m => ({ role: m.role, content: m.content }))] }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Нет ответа';
}

export default function MentorScreen() {
  const { state, setState, T } = useApp();
  const aiConfig = state.aiConfig || {};
  const prov = AI_PROVIDERS.find(p => p.id === (aiConfig.provider || 'claude')) || AI_PROVIDERS[0];
  const provColor = prov.color;
  const modelLabel = aiConfig.model || prov.defaultModel;

  const [messages, setMessages] = useState<ChatMessage[]>(() => state.aiHistory || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const isWelcome = messages.length === 0;

  const ctxSummary = useMemo(() => {
    const totalW = Object.values(state.history || {}).filter(l => l.completed).length;
    const streak = calcStreak(state.history || {});
    const prs = getPRs(state.history || {});
    const activeGoals = (state.goals || []).filter(g => !g.completed).length;
    const recentMood = (state.journal || [])[0]?.mood;
    return { totalW, streak, bestPR: Math.max(0, ...Object.values(prs)), activeGoals, recentMood };
  }, [state]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  const saveHistory = (msgs: ChatMessage[]) => {
    setState(s => ({ ...s, aiHistory: msgs.slice(-80) }));
  };

  const send = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: userText, ts: Date.now() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const reply = await callAI(newMsgs, buildAIContext(state), aiConfig as any);
      const aMsg: ChatMessage = { role: 'assistant', content: reply, ts: Date.now(), provider: aiConfig.provider || 'claude' };
      const final = [...newMsgs, aMsg];
      setMessages(final);
      saveHistory(final);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIdx < 0) return;
    const idx = messages.length - 1 - lastUserIdx;
    const trimmed = messages.slice(0, idx + 1);
    setMessages(trimmed);
    setLoading(true);
    setError(null);
    try {
      const reply = await callAI(trimmed, buildAIContext(state), aiConfig as any);
      const aMsg: ChatMessage = { role: 'assistant', content: reply, ts: Date.now(), provider: aiConfig.provider || 'claude' };
      const final = [...trimmed, aMsg];
      setMessages(final);
      saveHistory(final);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const clearChat = () => {
    Alert.alert('Очистить чат?', 'Все сообщения удалятся.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Очистить', style: 'destructive', onPress: () => { setMessages([]); saveHistory([]); setError(null); } },
    ]);
  };

  const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### ')) return <Text key={i} style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 15, color: provColor, marginTop: 8, marginBottom: 3 }}>{line.slice(4)}</Text>;
      if (line.startsWith('## ')) return <Text key={i} style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 16, color: T.txt, marginTop: 10, marginBottom: 4 }}>{line.slice(3)}</Text>;
      if (line.startsWith('- ') || line.startsWith('• ')) return (
        <View key={i} style={{ flexDirection: 'row', gap: 8, marginVertical: 2 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: provColor, marginTop: 9 }} />
          <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt, lineHeight: 21, flex: 1 }}>{line.slice(2)}</Text>
        </View>
      );
      if (!line.trim()) return <View key={i} style={{ height: 5 }} />;
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <Text key={i} style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt, lineHeight: 21 }}>
          {parts.map((pt, j) => pt.startsWith('**') && pt.endsWith('**')
            ? <Text key={j} style={{ fontFamily: 'Barlow_600SemiBold', color: T.txt }}>{pt.slice(2, -2)}</Text>
            : pt
          )}
        </Text>
      );
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={62}>

        {/* Header */}
        <View style={{ backgroundColor: T.surf, borderBottomWidth: 1, borderBottomColor: T.bord }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ position: 'relative' }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: provColor + '22', borderWidth: 1.5, borderColor: provColor + '66', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={19} color={provColor} />
                </View>
                <View style={{ position: 'absolute', bottom: -1, right: -1, width: 11, height: 11, borderRadius: 6, backgroundColor: T.success, borderWidth: 2.5, borderColor: T.surf }} />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.txt, letterSpacing: 0.5 }}>НЕЙРО</Text>
                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, backgroundColor: provColor + '22', borderWidth: 1, borderColor: provColor + '44' }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: provColor, letterSpacing: 0.5 }}>{prov.short.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>{modelLabel}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 5 }}>
              <TouchableOpacity onPress={() => send(PLAN_PROMPT)} disabled={loading} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: provColor + '66', backgroundColor: provColor + '15', opacity: loading ? 0.5 : 1 }}>
                <Calendar size={12} color={provColor} />
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: provColor }}>План</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowContext(!showContext)} style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: showContext ? provColor + '88' : T.bord, backgroundColor: showContext ? provColor + '18' : T.lo, alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={13} color={showContext ? provColor : T.muted} />
              </TouchableOpacity>
              {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
                <TouchableOpacity onPress={regenerate} disabled={loading} style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.4 : 1 }}>
                  <RotateCcw size={13} color={T.muted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={clearChat} style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={12} color={T.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowSettings(true)} style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={13} color={T.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Context drawer */}
          {showContext && (
            <View style={{ paddingHorizontal: 14, paddingBottom: 10, backgroundColor: provColor + '0C' }}>
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: provColor, letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' }}>Что видит ИИ</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { l: 'Тренировок', v: ctxSummary.totalW, i: '💪' },
                  { l: 'Серия', v: `${ctxSummary.streak}д`, i: '🔥' },
                  { l: 'Лучший PR', v: ctxSummary.bestPR || '—', i: '🏆' },
                  { l: 'Целей', v: ctxSummary.activeGoals, i: '🎯' },
                  { l: 'Настроение', v: ctxSummary.recentMood ? `${ctxSummary.recentMood}/5` : '—', i: '😊' },
                ].map((s, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: provColor + '18', borderWidth: 1, borderColor: provColor + '33', borderRadius: 8 }}>
                    <Text style={{ fontSize: 12 }}>{s.i}</Text>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: provColor }}>{s.v}</Text>
                    <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>{s.l}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quick prompts */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 10, gap: 5 }}>
            {QUICK_PROMPTS.map((p, i) => (
              <TouchableOpacity key={i} onPress={() => send(p.text)} disabled={loading} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo }}>
                <Text style={{ fontSize: 10 }}>{p.icon}</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>{p.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 12 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>

          {/* Welcome */}
          {isWelcome && (
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: provColor + '22', borderWidth: 2, borderColor: provColor + '44', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Sparkles size={32} color={provColor} />
              </View>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 26, color: T.txt, letterSpacing: 1, marginBottom: 6 }}>НЕЙРО</Text>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.muted, textAlign: 'center', lineHeight: 21, maxWidth: 260, marginBottom: 20 }}>
                Персональный ИИ-ассистент.{'\n'}Знает твои тренировки, цели и настроение.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: provColor }} />
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>{prov.name} · готов к работе</Text>
              </View>
            </View>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            const mProv = AI_PROVIDERS.find(p => p.id === m.provider) || prov;
            return (
              <View key={i} style={{ alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
                {!isUser && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 4 }}>
                    <View style={{ width: 16, height: 16, borderRadius: 5, backgroundColor: mProv.color + '22', borderWidth: 1, borderColor: mProv.color + '55', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={9} color={mProv.color} />
                    </View>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 9, color: T.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>{mProv.short}</Text>
                  </View>
                )}
                <View style={{
                  maxWidth: '88%',
                  padding: 12,
                  borderRadius: isUser ? 18 : 18,
                  borderBottomRightRadius: isUser ? 5 : 18,
                  borderBottomLeftRadius: isUser ? 18 : 5,
                  backgroundColor: isUser ? provColor : T.card,
                  borderWidth: isUser ? 0 : 1,
                  borderColor: T.bord,
                }}>
                  {isUser
                    ? <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: '#000', lineHeight: 20 }}>{m.content}</Text>
                    : <View>{renderContent(m.content)}</View>
                  }
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: isUser ? 0 : 4, marginRight: isUser ? 4 : 0 }}>
                  {m.ts && <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 9, color: T.muted }}>{fmtTime(m.ts)}</Text>}
                  {!isUser && (
                    <TouchableOpacity onPress={() => { setCopiedId(i); setTimeout(() => setCopiedId(null), 1500); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, opacity: 0.7 }}>
                      {copiedId === i ? <Check size={10} color={T.success} strokeWidth={3} /> : <MessageSquare size={10} color={T.muted} />}
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 9, color: copiedId === i ? T.success : T.muted }}>{copiedId === i ? 'Скоп.' : 'Копировать'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {/* Loading */}
          {loading && (
            <View style={{ alignItems: 'flex-start', gap: 6 }}>
              <View style={{ width: 16, height: 16, borderRadius: 5, backgroundColor: provColor + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={9} color={provColor} />
              </View>
              <View style={{ padding: 14, borderRadius: 18, borderBottomLeftRadius: 5, backgroundColor: T.card, borderWidth: 1, borderColor: T.bord, flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                {[0, 1, 2].map(j => (
                  <View key={j} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: provColor }} />
                ))}
              </View>
            </View>
          )}

          {/* Error */}
          {error && (
            <View style={{ padding: 12, backgroundColor: T.danger + '18', borderWidth: 1, borderColor: T.danger + '55', borderRadius: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <AlertTriangle size={15} color={T.danger} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                {error.split('\n').map((line, i) => (
                  <Text key={i} style={{ fontFamily: i === 0 ? 'BarlowCondensed_700Bold' : 'Barlow_400Regular', fontSize: i === 0 ? 14 : 12, color: i === 0 ? T.danger : T.txt, lineHeight: 18 }}>{line}</Text>
                ))}
                {error.includes('ключ') && (
                  <TouchableOpacity onPress={() => setShowSettings(true)}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: T.primary, marginTop: 4 }}>Открыть настройки →</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => setError(null)}>
                <X size={13} color={T.muted} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={{ padding: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: T.bord, backgroundColor: T.surf }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send()}
              placeholder="Напиши что угодно…"
              placeholderTextColor={T.muted}
              multiline
              style={{
                flex: 1,
                maxHeight: 120,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: input ? provColor + '99' : T.bord,
                backgroundColor: T.lo,
                color: T.txt,
                fontFamily: 'Barlow_400Regular',
                fontSize: 14,
                paddingHorizontal: 14,
                paddingVertical: 11,
                lineHeight: 20,
              }}
            />
            <TouchableOpacity onPress={() => send()} disabled={!input.trim() || loading}
              style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: input.trim() && !loading ? provColor : T.lo, alignItems: 'center', justifyContent: 'center', opacity: !input.trim() || loading ? 0.6 : 1 }}>
              {loading
                ? <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2.5, borderColor: T.primary, borderTopColor: 'transparent' }} />
                : <ChevronRight size={22} color={input.trim() ? '#000' : T.muted} strokeWidth={2.5} />
              }
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: T.success }} />
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>{prov.name} · {modelLabel}</Text>
            </View>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>{Math.ceil(messages.filter(m => m.role !== 'system').length / 2)} ответов</Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Settings modal placeholder */}
      {showSettings && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }} onPress={() => setShowSettings(false)}>
            <Pressable onPress={() => {}}>
              <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, maxHeight: '80%' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.txt }}>Настройки НЕЙРО</Text>
                  <TouchableOpacity onPress={() => setShowSettings(false)}>
                    <X size={18} color={T.muted} />
                  </TouchableOpacity>
                </View>

                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, marginBottom: 12 }}>Провайдер</Text>
                <ScrollView>
                  {AI_PROVIDERS.map(p => (
                    <TouchableOpacity key={p.id} onPress={() => setState(s => ({ ...s, aiConfig: { ...s.aiConfig, provider: p.id, model: p.defaultModel } }))}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: (aiConfig.provider || 'claude') === p.id ? p.color : T.bord, backgroundColor: (aiConfig.provider || 'claude') === p.id ? p.color + '18' : T.lo, marginBottom: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.color }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.txt }}>{p.name}</Text>
                        <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>{p.desc}</Text>
                      </View>
                      {!p.needsKey && <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: T.success + '22', borderRadius: 6 }}>
                        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 9, color: T.success }}>FREE</Text>
                      </View>}
                      {(aiConfig.provider || 'claude') === p.id && <Check size={14} color={p.color} strokeWidth={2.5} />}
                    </TouchableOpacity>
                  ))}

                  {/* API Key input */}
                  {AI_PROVIDERS.find(p => p.id === (aiConfig.provider || 'claude'))?.needsKey && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: T.muted, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>API Ключ</Text>
                      <TextInput
                        value={aiConfig.apiKey}
                        onChangeText={v => setState(s => ({ ...s, aiConfig: { ...s.aiConfig, apiKey: v } }))}
                        placeholder="Вставь API ключ…"
                        placeholderTextColor={T.muted}
                        secureTextEntry
                        style={{ height: 42, borderRadius: 9, borderWidth: 1.5, borderColor: aiConfig.apiKey ? T.success + '99' : T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 14, paddingHorizontal: 12 }}
                      />
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.warn, marginTop: 6 }}>
                        ⚠️ Хранится локально на устройстве
                      </Text>
                    </View>
                  )}
                </ScrollView>

                <TouchableOpacity onPress={() => setShowSettings(false)} style={{ marginTop: 16, height: 44, borderRadius: 10, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: '#000' }}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
