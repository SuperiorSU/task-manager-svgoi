/**
 * FormTextField — a single labeled text input block used by create/edit
 * people forms (e.g. Create user, screen 53).
 *
 * Focus state lives inside this component, not in the parent screen. A
 * screen with several chained fields (name -> staffId -> phone -> email)
 * used to hold one shared `focused: string | null` state, so every
 * focus/blur on any field re-rendered the whole form. Keeping it local here
 * decouples each field's render from its siblings and removes one input to
 * the focus-chaining race that caused fields to steal focus back and forth
 * (see the `submitBehavior="submit"` note below).
 */

import React, { memo, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { useColors } from '../../constants/colors';
import { Layout } from '../../constants/spacing';

type Props = {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  error?: string;
  inputRef?: React.RefObject<TextInput | null>;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  returnKeyType?: TextInput['props']['returnKeyType'];
  onSubmitEditing?: () => void;
};

function FormTextFieldImpl({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  error,
  inputRef,
  keyboardType,
  autoCapitalize = 'words',
  returnKeyType = 'next',
  onSubmitEditing,
}: Props) {
  const colors = useColors();
  // Local, per-field focus state — never lifted to the parent screen.
  const [focused, setFocused] = useState(false);

  return (
    <View style={s.block}>
      <Text style={[s.label, { color: colors.text.secondary }]}>
        {label}
        {hint ? <Text style={[s.hint, { color: colors.text.tertiary }]}> · {hint}</Text> : null}
      </Text>
      <View
        style={[
          s.input,
          {
            backgroundColor: colors.surface.card,
            borderColor: error ? colors.semantic.error : focused ? colors.brand.primary : colors.surface.border,
          },
          // No dynamic shadow/elevation on focus (was here previously): on
          // Android, toggling `elevation` forces the view onto a new render
          // layer and can force a re-layout at the exact moment the IME is
          // attaching to this field, which can visibly flicker the keyboard
          // closed-then-open. Border color alone gives the same focus
          // affordance without touching layering.
        ]}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          // Without this, RN's default 'blurAndSubmit' behavior fires its own
          // blur at the same time a chained onSubmitEditing -> ref.focus()
          // call moves focus forward, and the two can race and flicker focus
          // back and forth between fields. 'submit' leaves focus movement
          // solely to the explicit ref chain below.
          submitBehavior="submit"
          style={[s.textInput, { color: colors.text.primary }, Platform.select({ android: { padding: 0 } })]}
        />
      </View>
      {error ? <Text style={[s.error, { color: colors.semantic.error }]}>{error}</Text> : null}
    </View>
  );
}

export const FormTextField = memo(FormTextFieldImpl);

const s = StyleSheet.create({
  block: { width: '100%', marginBottom: 18 },
  label: { fontSize: 12, fontFamily: 'Inter-SemiBold', marginBottom: 8 },
  hint: { fontSize: 12, fontFamily: 'Inter-Regular' },
  input: {
    width: '100%',
    height: 50,
    borderRadius: Layout.inputRadius,
    borderWidth: 1.5,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  textInput: { width: '100%', fontSize: 14, letterSpacing: 0 },
  error: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 4 },
});
