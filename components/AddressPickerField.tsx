import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Reusable picker field for address forms (country / region / city).
 * Tapping the field opens a searchable modal list. Supports free-text
 * fallback (users can still type a value not in the list).
 */
export function AddressPickerField({
  label,
  value,
  options,
  onChange,
  placeholder,
  allowCustom = true,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((o) => o.label.toLowerCase().includes(query));
  }, [options, search]);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} activeOpacity={0.85} onPress={() => setOpen(true)}>
        <Text style={value ? styles.fieldValue : styles.fieldPlaceholder} numberOfLines={1}>
          {value || placeholder || 'Select…'}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#999" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setOpen(false)} activeOpacity={0.85}>
                <Ionicons name="close" size={18} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color="#999" />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search…"
                placeholderTextColor="#aaa"
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No matching options</Text>
              }
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    activeOpacity={0.85}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {selected ? <Ionicons name="checkmark" size={16} color="#ff6a00" /> : null}
                  </TouchableOpacity>
                );
              }}
            />

            {allowCustom ? (
              <TouchableOpacity
                style={styles.customRow}
                activeOpacity={0.85}
                onPress={() => {
                  if (search.trim()) {
                    onChange(search.trim());
                    setOpen(false);
                    setSearch('');
                  }
                }}
              >
                <Ionicons name="create-outline" size={16} color="#ff6a00" />
                <Text style={styles.customText}>
                  {search.trim() ? `Use “${search.trim()}”` : 'Type a custom value'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4e260d',
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5d9ce',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
  },
  fieldValue: { color: '#111', fontSize: 15, flex: 1 },
  fieldPlaceholder: { color: '#aaa', fontSize: 15, flex: 1 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '75%',
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  sheetTitle: { fontSize: 17, fontWeight: '900', color: '#111' },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3ede7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f0eb',
    borderRadius: 12,
    marginHorizontal: 18,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    paddingVertical: 10,
  },
  listContent: { paddingHorizontal: 18, paddingTop: 4 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  optionRowSelected: { backgroundColor: '#fff0e0' },
  optionText: { fontSize: 15, color: '#333', flex: 1 },
  optionTextSelected: { color: '#ff6a00', fontWeight: '800' },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 24, fontSize: 14 },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 18,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fbf7f2',
    borderRadius: 10,
  },
  customText: { color: '#ff6a00', fontSize: 14, fontWeight: '700' },
});
