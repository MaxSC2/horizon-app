// src/components/ThemePickerModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { X, Moon, Sun, Check } from 'lucide-react-native';
import { Theme } from '../types';
import { THEMES, getTheme } from '../theme';

interface Props {
  T: Theme;
  currentThemeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function ThemePickerModal({ T, currentThemeId, onSelect, onClose }: Props) {
  const dark = THEMES.filter(t => t.dark);
  const light = THEMES.filter(t => !t.dark);

  const ThemeCard = ({ theme }: { theme: typeof THEMES[0] }) => {
    const th = getTheme(theme.id);
    const isActive = theme.id === currentThemeId;
    return (
      <TouchableOpacity
        onPress={() => { onSelect(theme.id); onClose(); }}
        style={{
          flex: 1,
          padding: 12,
          borderRadius: 14,
          borderWidth: isActive ? 2 : 1.5,
          borderColor: isActive ? th.primary : T.bord,
          backgroundColor: isActive ? th.primary + '18' : T.card,
          margin: 4,
        }}
      >
        {/* Mini preview */}
        <View style={{ height: 44, borderRadius: 8, backgroundColor: th.bg, borderWidth: 1, borderColor: th.bord, marginBottom: 10, overflow: 'hidden' }}>
          <View style={{ height: 12, backgroundColor: th.surf, borderBottomWidth: 1, borderBottomColor: th.bord, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, gap: 3 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: th.primary }} />
            <View style={{ width: 18, height: 3, borderRadius: 2, backgroundColor: th.primary, opacity: 0.5 }} />
          </View>
          <View style={{ padding: 4, gap: 2 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: th.primary, opacity: 0.7, width: '60%' }} />
            <View style={{ height: 3, borderRadius: 2, backgroundColor: th.txt, opacity: 0.2, width: '90%' }} />
            <View style={{ height: 3, borderRadius: 2, backgroundColor: th.success, opacity: 0.5, width: '45%' }} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <Text style={{ fontSize: 14 }}>{theme.icon}</Text>
          <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 14, color: isActive ? th.primary : T.txt, flex: 1 }}>{theme.name}</Text>
          {isActive && <Check size={12} color={th.primary} strokeWidth={3} />}
        </View>
        <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted, marginBottom: 7 }}>{theme.icon === '🌌' ? 'Глубокий тёмно-синий' : theme.name}</Text>

        {/* Color strip */}
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {[th.primary, th.success, th.warn, th.danger].map((c, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: c }} />
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={() => {}}>
          <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '85%' }}>
            {/* Header */}
            <View style={{ padding: 18, paddingBottom: 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: T.primary + '18', borderWidth: 1, borderColor: T.primary + '44', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16 }}>🎨</Text>
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: T.txt }}>Тема оформления</Text>
                    <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>{THEMES.length} стилей</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} color={T.muted} />
                </TouchableOpacity>
              </View>

              {/* Active theme badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, paddingHorizontal: 12, backgroundColor: T.primary + '15', borderWidth: 1, borderColor: T.primary + '33', borderRadius: 10, marginBottom: 16 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: T.primary }} />
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.txt }}>Сейчас: </Text>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.primary }}>
                  {THEMES.find(t => t.id === currentThemeId)?.icon} {THEMES.find(t => t.id === currentThemeId)?.name}
                </Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 30 }}>
              {/* Dark */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Moon size={13} color={T.muted} />
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, letterSpacing: 1.5, color: T.muted, textTransform: 'uppercase' }}>Тёмные темы</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -4, marginBottom: 16 }}>
                {dark.map(theme => <ThemeCard key={theme.id} theme={theme} />)}
              </View>

              {/* Light */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Sun size={13} color={T.muted} />
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, letterSpacing: 1.5, color: T.muted, textTransform: 'uppercase' }}>Светлые темы</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -4 }}>
                {light.map(theme => <ThemeCard key={theme.id} theme={theme} />)}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
