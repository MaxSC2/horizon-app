// src/screens/WorkoutScreen.tsx
// Full workout session screen - see DESIGN_SPEC.md for detailed UI spec
// Re-exports core logic from helpers.ts and data.ts

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Pressable, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Pencil, Check, Trophy, AlertTriangle } from 'lucide-react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useApp } from '../AppContext';
import { Card, Lbl, Badge, ProgressBar } from '../components';
import { fmt, weekDates, todayIdx, getPRs } from '../helpers';
import { PLAN } from '../data';

function NumpadModal({ T, value, onChange, onConfirm, unit, placeholder, color }: any) {
  const [display, setDisplay] = useState(value || '');
  const col = color || T.primary;
  const tap = (k: string) => {
    if (k === '⌫') { setDisplay((d: string) => d.slice(0, -1)); return; }
    if (k === '+1') { setDisplay((d: string) => String(Math.max(0, (parseInt(d) || 0) + 1))); return; }
    if (k === '-1') { setDisplay((d: string) => String(Math.max(0, (parseInt(d) || 0) - 1))); return; }
    if (display.length < 4) setDisplay((d: string) => d + k);
  };
  const rows = [['1','2','3'],['4','5','6'],['7','8','9'],['⌫','0','✓']];
  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => onConfirm(display)}>
      <Pressable style={{ flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'flex-end' }} onPress={() => onConfirm(display)}>
        <Pressable onPress={() => {}}>
          <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 8 }}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 52, color: display ? T.txt : T.muted, lineHeight: 58 }}>{display || placeholder}</Text>
                {display && <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 22, color: T.muted, marginBottom: 8 }}>{unit}</Text>}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                {['-1', '+1'].map(d => (
                  <TouchableOpacity key={d} onPress={() => tap(d)} style={{ paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.muted }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ gap: 8 }}>
              {rows.map((row, ri) => (
                <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
                  {row.map((k, ki) => {
                    const isConfirm = k === '✓'; const isDel = k === '⌫';
                    return (
                      <TouchableOpacity key={ki} onPress={() => isConfirm ? onConfirm(display) : tap(k)} activeOpacity={0.7}
                        style={{ flex:1, height:56, borderRadius:12, backgroundColor: isConfirm ? col : isDel ? T.danger+'22' : T.lo, alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ fontFamily: isConfirm ? 'BarlowCondensed_900Black' : 'BarlowCondensed_700Bold', fontSize: isConfirm ? 16 : 22, color: isConfirm ? '#000' : isDel ? T.danger : T.txt, letterSpacing: isConfirm ? 0.5 : 0 }}>
                          {isConfirm ? 'ГОТОВО' : k}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function RestTimerModal({ T, onDone }: any) {
  const PRESETS = [60, 90, 120, 180];
  const [total, setTotal] = useState(90);
  const [s, setS] = useState(90);
  const ref = useRef<any>(null);
  const start = (dur: number) => {
    clearInterval(ref.current); setTotal(dur); setS(dur);
    ref.current = setInterval(() => setS(x => { if (x <= 1) { clearInterval(ref.current); onDone(); return 0; } if (x === 4) Vibration.vibrate(200); return x-1; }), 1000);
  };
  useEffect(() => { start(90); return () => clearInterval(ref.current); }, []);
  const col = s < 20 ? T.warn : s < total*0.5 ? T.primary : T.success;
  const r=48; const circ=2*Math.PI*r; const offset=circ-(circ*(s/total));
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDone}>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.82)', alignItems:'center', justifyContent:'center' }}>
        <View style={{ backgroundColor:T.card, borderWidth:1, borderColor:T.bord, borderRadius:22, padding:28, alignItems:'center', minWidth:250 }}>
          <Text style={{ fontFamily:'BarlowCondensed_900Black', fontSize:13, letterSpacing:2, color:T.muted, marginBottom:14 }}>⏱ ОТДЫХ</Text>
          <Svg width={120} height={120} style={{ marginBottom:16 }}>
            <Circle cx={60} cy={60} r={r} fill="none" stroke={T.lo} strokeWidth={8}/>
            <Circle cx={60} cy={60} r={r} fill="none" stroke={col} strokeWidth={8} strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} strokeLinecap="round" rotation="-90" origin="60,60"/>
            <SvgText x={60} y={54} textAnchor="middle" fill={T.txt} fontSize={34} fontWeight="900">{s}</SvgText>
            <SvgText x={60} y={74} textAnchor="middle" fill={T.muted} fontSize={11}>сек</SvgText>
          </Svg>
          <View style={{ flexDirection:'row', gap:6, marginBottom:14 }}>
            {PRESETS.map(d => (
              <TouchableOpacity key={d} onPress={() => start(d)} style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:8, borderWidth:1.5, borderColor: total===d?T.primary:T.bord, backgroundColor: total===d?T.primary+'22':T.lo }}>
                <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:12, color: total===d?T.primary:T.muted }}>{d}с</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={onDone} style={{ width:'100%', height:40, borderRadius:10, borderWidth:1, borderColor:T.bord, backgroundColor:T.lo, alignItems:'center', justifyContent:'center' }}>
            <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:13, color:T.muted }}>Пропустить →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ExerciseCard({ T, exercise, logs, onComplete, onValueChange, onRest, prVal }: any) {
  const [activeNumpad, setActiveNumpad] = useState<number|null>(null);
  const allDone = logs.every((s: any) => s.done);
  const maxLogged = Math.max(0, ...logs.map((s: any) => parseInt(s.value)||0));
  const isNewPR = maxLogged>0 && prVal>0 && maxLogged>prVal;
  return (
    <>
      {activeNumpad!==null && (
        <NumpadModal T={T} value={logs[activeNumpad]?.value||''} onChange={(v: string)=>onValueChange(activeNumpad,v)}
          onConfirm={(val: string)=>{ if(val) onValueChange(activeNumpad,val); setActiveNumpad(null); onComplete(activeNumpad); onRest(); }}
          unit={exercise.type==='seconds'?'сек':'повт'} placeholder={exercise.reps} color={T.primary}/>
      )}
      <Card T={T} style={{ marginBottom:10, borderWidth:allDone?1.5:1, borderColor:allDone?T.success+'66':T.bord }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <View style={{ flex:1 }}>
            <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:17, color:T.txt }}>{exercise.name}</Text>
            <Text style={{ fontFamily:'Barlow_400Regular', fontSize:12, color:T.muted, marginTop:2 }}>
              {exercise.sets} подхода · {exercise.reps} {exercise.type==='seconds'?'сек':'повт'}{exercise.notes?` · ${exercise.notes}`:''}
            </Text>
          </View>
          <View style={{ alignItems:'flex-end', gap:4, marginLeft:8 }}>
            {allDone && <Check size={18} color={T.success} strokeWidth={2.5}/>}
            {isNewPR && (
              <View style={{ flexDirection:'row', alignItems:'center', gap:3, backgroundColor:T.warn+'22', borderWidth:1, borderColor:T.warn+'55', borderRadius:20, paddingHorizontal:8, paddingVertical:2 }}>
                <Trophy size={11} color={T.warn}/>
                <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:11, color:T.warn, letterSpacing:0.5 }}>PR!</Text>
              </View>
            )}
            {prVal>0 && <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:11, color:T.muted }}>рек: {prVal}</Text>}
          </View>
        </View>
        {logs.map((log: any, si: number) => (
          <View key={si} style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 }}>
            <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:13, color:T.muted, width:18, textAlign:'right' }}>{si+1}</Text>
            {!log.done ? (
              <TouchableOpacity onPress={()=>setActiveNumpad(si)} style={{ width:72, height:44, borderRadius:10, borderWidth:1.5, borderColor:log.value?T.primary+'99':T.bord, backgroundColor:log.value?T.primary+'18':T.lo, alignItems:'center', justifyContent:'center' }}>
                {log.value ? <Text style={{ fontFamily:'BarlowCondensed_900Black', fontSize:22, color:T.txt }}>{log.value}</Text>
                  : <Text style={{ fontFamily:'Barlow_400Regular', fontSize:13, color:T.muted, opacity:0.6 }}>{exercise.reps}</Text>}
              </TouchableOpacity>
            ) : (
              <View style={{ width:72, height:44, borderRadius:10, borderWidth:1.5, borderColor:T.success+'55', backgroundColor:T.success+'18', alignItems:'center', justifyContent:'center' }}>
                <Text style={{ fontFamily:'BarlowCondensed_900Black', fontSize:22, color:T.success }}>{log.value}</Text>
              </View>
            )}
            <Text style={{ fontFamily:'Barlow_400Regular', fontSize:12, color:T.muted, width:32 }}>{exercise.type==='seconds'?'сек':'повт'}</Text>
            {!log.done ? (
              <TouchableOpacity onPress={()=>{ if(!log.value){setActiveNumpad(si);return;} onComplete(si); onRest(); }}
                style={{ flex:1, height:44, borderRadius:10, borderWidth:1, borderColor:log.value?T.success+'66':T.bord, backgroundColor:log.value?T.success+'18':T.lo, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5 }}>
                <Check size={14} color={log.value?T.success:T.muted} strokeWidth={log.value?2.5:1.5}/>
                <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:13, color:log.value?T.success:T.muted }}>{log.value?'Готово':'Ввести'}</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:4 }}>
                <Check size={14} color={T.success} strokeWidth={2.5}/>
                <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:13, color:T.success }}>Выполнено</Text>
              </View>
            )}
          </View>
        ))}
      </Card>
    </>
  );
}

export default function WorkoutScreen() {
  const { state, T, session, setSession, startWorkout, finishWorkout } = useApp();
  const { history } = state;
  const [showHist, setShowHist] = useState(false);
  const [histSearch, setHistSearch] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const prs = getPRs(history);
  const dates = weekDates();
  const todayI = todayIdx();

  useEffect(() => {
    if (!session) return;
    const startMs = session.startTime ? new Date(session.startTime).getTime() : Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now()-startMs)/1000)), 1000);
    return () => clearInterval(t);
  }, [!!session]);

  const fmtTime = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const upd = (patch: any) => setSession((s: any) => s ? {...s,...patch} : s);

  if (!session) {
    const entries = Object.entries(history).filter(([,l])=>l.completed).sort(([a],[b])=>b>a?1:-1);
    const filtered = histSearch ? entries.filter(([d,l])=>d.includes(histSearch)||PLAN.find(p=>p.id===(l as any).dayId)?.name.toLowerCase().includes(histSearch.toLowerCase())) : entries.slice(0,20);
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:T.bg }}>
        <ScrollView contentContainerStyle={{ padding:14, paddingBottom:20 }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <Text style={{ fontFamily:'BarlowCondensed_900Black', fontSize:24, color:T.txt }}>Тренировка</Text>
            <TouchableOpacity onPress={()=>setShowHist(!showHist)} style={{ flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:6, borderRadius:9, borderWidth:1, borderColor:T.bord, backgroundColor:showHist?T.primary+'22':T.lo }}>
              <Clock size={12} color={showHist?T.primary:T.muted}/>
              <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:12, color:showHist?T.primary:T.muted }}>{showHist?'Текущая':'История'}</Text>
            </TouchableOpacity>
          </View>
          {!showHist && PLAN.map((plan,i)=>{
            const log=history[fmt(dates[i])]; const isToday=i===todayI;
            return (
              <Card key={i} T={T} style={{ marginBottom:8, borderWidth:isToday?1.5:1, borderColor:isToday?T.primary+'66':T.bord, opacity:plan.type==='rest'?0.6:1 }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                    <Text style={{ fontSize:24 }}>{plan.emoji}</Text>
                    <View>
                      <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:16, color:isToday?T.primary:T.txt }}>{plan.day} — {plan.name}</Text>
                      <Text style={{ fontFamily:'Barlow_400Regular', fontSize:12, color:T.muted }}>{plan.type==='rest'?'Отдых':log?.completed?`Сложность ${log.difficulty}/10`:`${plan.exercises?.length||0} упр.`}</Text>
                    </View>
                  </View>
                  {log?.completed ? <Badge color={T.success} T={T}>✓</Badge>
                    : plan.type!=='rest' ? <TouchableOpacity onPress={()=>startWorkout(i)} style={{ paddingHorizontal:14, paddingVertical:7, borderRadius:8, backgroundColor:isToday?T.primary:T.lo, borderWidth:isToday?0:1, borderColor:T.bord }}>
                        <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:13, color:isToday?'#000':T.muted }}>▶</Text>
                      </TouchableOpacity>
                    : <Badge color={T.muted} T={T}>~</Badge>}
                </View>
              </Card>
            );
          })}
          {showHist && (
            <>
              <TextInput value={histSearch} onChangeText={setHistSearch} placeholder="Поиск…" placeholderTextColor={T.muted} style={{ height:40, borderRadius:10, borderWidth:1.5, borderColor:T.bord, backgroundColor:T.lo, color:T.txt, fontFamily:'Barlow_400Regular', fontSize:14, paddingHorizontal:14, marginBottom:12 }}/>
              {filtered.map(([date,log])=>{
                const plan=PLAN.find(p=>p.id===(log as any).dayId)||{name:'Тренировка',emoji:'💪'};
                const reps=Object.values((log as any).exercises||{}).flat().reduce((s:number,x:any)=>s+(parseInt(x.value)||0),0);
                return (
                  <Card key={date} T={T} style={{ marginBottom:8 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                      <Text style={{ fontSize:22 }}>{plan.emoji}</Text>
                      <View>
                        <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:15, color:T.txt }}>{plan.name}</Text>
                        <Text style={{ fontFamily:'Barlow_400Regular', fontSize:12, color:T.muted }}>{new Date(date+'T12:00:00').toLocaleDateString('ru-RU',{weekday:'short',day:'numeric',month:'short'})}</Text>
                        <View style={{ flexDirection:'row', gap:6, marginTop:4 }}>
                          <Badge color={T.primary} T={T}>{Object.keys((log as any).exercises||{}).length} упр.</Badge>
                          {reps>0&&<Badge color={T.success} T={T}>{reps} повт</Badge>}
                          {(log as any).difficulty&&<Badge color={(log as any).difficulty>=8?T.danger:T.warn} T={T}>💪 {(log as any).difficulty}/10</Badge>}
                        </View>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const plan = PLAN[session.dayIdx];
  const doneSets = Object.values(session.exerciseLogs).flat().filter((s:any)=>s.done).length;
  const totalSets = Object.values(session.exerciseLogs).flat().length;
  const allExDone = plan.exercises.every(ex=>session.exerciseLogs[ex.id]?.every((s:any)=>s.done));
  const painDanger = session.painNotes?.toLowerCase().match(/сустав|колен|плеч|локт|запяст/);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:T.bg }}>
      {session.showRest && <RestTimerModal T={T} onDone={()=>upd({showRest:false})}/>}
      <ScrollView contentContainerStyle={{ padding:14, paddingBottom:20 }}>

        {session.phase==='warmup' && (<>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
            <Lbl T={T}>Этап 1 / 3</Lbl>
            <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
              <Clock size={12} color={T.muted}/><Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:13, color:T.muted }}>{fmtTime(elapsed)}</Text>
            </View>
          </View>
          <Text style={{ fontFamily:'BarlowCondensed_900Black', fontSize:26, color:T.txt, marginBottom:14 }}>🔥 Разминка — {plan.name}</Text>
          <Card T={T} style={{ marginBottom:12 }}>
            {plan.warmup.map((item,i)=>(
              <TouchableOpacity key={i} onPress={()=>{ const s=new Set(session.warmupDone); s.has(i)?s.delete(i):s.add(i); upd({warmupDone:s}); }}
                style={{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:10, borderBottomWidth:i<plan.warmup.length-1?1:0, borderBottomColor:T.bord }}>
                <View style={{ width:22, height:22, borderRadius:6, borderWidth:2, borderColor:session.warmupDone.has(i)?T.success:T.muted, backgroundColor:session.warmupDone.has(i)?T.success:'transparent', alignItems:'center', justifyContent:'center' }}>
                  {session.warmupDone.has(i)&&<Text style={{ color:'#000', fontSize:13, fontWeight:'900' }}>✓</Text>}
                </View>
                <Text style={{ fontFamily:'Barlow_400Regular', fontSize:15, color:session.warmupDone.has(i)?T.muted:T.txt, textDecorationLine:session.warmupDone.has(i)?'line-through':'none', flex:1 }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </Card>
          <TouchableOpacity onPress={()=>upd({phase:'exercises'})} style={{ height:50, borderRadius:12, borderWidth:session.warmupDone.size>=plan.warmup.length?0:1.5, borderColor:T.primary, backgroundColor:session.warmupDone.size>=plan.warmup.length?T.primary:'transparent', alignItems:'center', justifyContent:'center' }}>
            <Text style={{ fontFamily:'BarlowCondensed_900Black', fontSize:16, color:session.warmupDone.size>=plan.warmup.length?'#000':T.primary }}>Начать упражнения →</Text>
          </TouchableOpacity>
        </>)}

        {session.phase==='exercises' && (<>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <View><Lbl T={T} style={{ marginBottom:4 }}>Этап 2 / 3</Lbl><Text style={{ fontFamily:'BarlowCondensed_900Black', fontSize:24, color:T.txt }}>💪 {plan.name}</Text></View>
            <View style={{ alignItems:'flex-end' }}>
              <Text style={{ fontFamily:'BarlowCondensed_900Black', fontSize:22, color:doneSets===totalSets?T.success:T.primary }}>{doneSets}/{totalSets}</Text>
              <Lbl T={T}>подходов</Lbl>
              <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:3 }}>
                <Clock size={10} color={T.muted}/><Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:11, color:T.muted }}>{fmtTime(elapsed)}</Text>
              </View>
            </View>
          </View>
          <ProgressBar pct={totalSets>0?(doneSets/totalSets)*100:0} color={T.primary} T={T} height={6}/>
          <View style={{ marginBottom:14 }}/>
          {plan.exercises.map(ex=>(
            <ExerciseCard key={ex.id} T={T} exercise={ex} logs={session.exerciseLogs[ex.id]||[]}
              onComplete={(si: number)=>{ const l={...session.exerciseLogs}; l[ex.id]=l[ex.id].map((x:any,j:number)=>j===si?{...x,done:true}:x); upd({exerciseLogs:l}); }}
              onValueChange={(si: number,v: string)=>{ const l={...session.exerciseLogs}; l[ex.id]=l[ex.id].map((x:any,j:number)=>j===si?{...x,value:v}:x); upd({exerciseLogs:l}); }}
              onRest={()=>upd({showRest:true})} prVal={prs[ex.id]||0}/>
          ))}
          <TouchableOpacity onPress={()=>upd({phase:'finish'})} style={{ height:50, borderRadius:12, borderWidth:allExDone?0:1.5, borderColor:T.success, backgroundColor:allExDone?T.success:'transparent', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
            <Text style={{ fontFamily:'BarlowCondensed_900Black', fontSize:16, color:allExDone?'#000':T.success }}>{allExDone?'✓ Завершить →':'Завершить (не всё) →'}</Text>
          </TouchableOpacity>
        </>)}

        {session.phase==='finish' && (<>
          <Lbl T={T} style={{ marginBottom:4 }}>Этап 3 / 3</Lbl>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <Text style={{ fontFamily:'BarlowCondensed_900Black', fontSize:26, color:T.txt }}>🏁 Завершение</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:5, backgroundColor:T.lo, borderRadius:8 }}>
              <Clock size={13} color={T.success}/><Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:15, color:T.success }}>{fmtTime(elapsed)}</Text>
            </View>
          </View>
          <Card T={T} style={{ marginBottom:12 }}>
            <Lbl T={T} style={{ marginBottom:12 }}>Сложность тренировки</Lbl>
            <View style={{ flexDirection:'row', gap:5, flexWrap:'wrap', marginBottom:8 }}>
              {Array.from({length:10},(_,i)=>i+1).map(n=>(
                <TouchableOpacity key={n} onPress={()=>upd({difficulty:n})} style={{ width:40, height:40, borderRadius:8, borderWidth:2, borderColor:session.difficulty===n?T.primary:T.bord, backgroundColor:session.difficulty===n?T.primary+'22':T.lo, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ fontFamily:'BarlowCondensed_700Bold', fontSize:17, color:session.difficulty===n?T.primary:T.muted }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ padding:8, paddingHorizontal:12, borderRadius:8, backgroundColor:T.lo }}>
              <Text style={{ fontFamily:'Barlow_400Regular', fontSize:13, color:session.difficulty<=3?T.primary:session.difficulty>=9?T.danger:T.success }}>
                {session.difficulty<=3?'😴 Слишком легко':session.difficulty<=6?'💪 Хороший диапазон':session.difficulty<=8?'🔥 Тяжело, но продуктивно':'😤 Очень тяжело — следи за восстановлением'}
              </Text>
            </View>
          </Card>
          <Card T={T} style={{ marginBottom:16 }}>
            <Lbl T={T} style={{ marginBottom:8 }}>Заметки к тренировке</Lbl>
            <TextInput value={session.workoutNotes||''} onChangeText={v=>upd({workoutNotes:v})} placeholder="Что заметил, что улучшить…" placeholderTextColor={T.muted} multiline
              style={{ borderRadius:8, borderWidth:1.5, borderColor:T.bord, backgroundColor:T.lo, color:T.txt, fontFamily:'Barlow_400Regular', fontSize:14, padding:10, minHeight:70, textAlignVertical:'top', marginBottom:12 }}/>
            <Lbl T={T} style={{ marginBottom:8 }}>Болевые ощущения</Lbl>
            <TextInput value={session.painNotes||''} onChangeText={v=>upd({painNotes:v})} placeholder="Опиши, если что-то беспокоило…" placeholderTextColor={T.muted} multiline
              style={{ borderRadius:8, borderWidth:1.5, borderColor:painDanger?T.danger:T.bord, backgroundColor:T.lo, color:T.txt, fontFamily:'Barlow_400Regular', fontSize:14, padding:10, minHeight:60, textAlignVertical:'top' }}/>
            {painDanger&&<View style={{ marginTop:8, padding:10, backgroundColor:T.danger+'18', borderWidth:1, borderColor:T.danger+'55', borderRadius:8, flexDirection:'row', alignItems:'center', gap:7 }}>
              <AlertTriangle size={15} color={T.danger}/><Text style={{ fontFamily:'Barlow_400Regular', fontSize:13, color:T.danger }}>Боль в суставах — снизь нагрузку</Text>
            </View>}
          </Card>
          <TouchableOpacity onPress={finishWorkout} style={{ height:54, borderRadius:12, backgroundColor:T.success, alignItems:'center', justifyContent:'center' }}>
            <Text style={{ fontFamily:'BarlowCondensed_900Black', fontSize:18, color:'#000' }}>✓ Сохранить тренировку</Text>
          </TouchableOpacity>
        </>)}
      </ScrollView>
    </SafeAreaView>
  );
}
