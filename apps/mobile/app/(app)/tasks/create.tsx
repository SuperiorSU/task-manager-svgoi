import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';

import { createTaskSchema } from '@godigitify/types';
import type { CreateTaskDto } from '@godigitify/types';

import { Colors } from '../../../src/constants/colors';
import { Typography } from '../../../src/constants/typography';
import { Spacing } from '../../../src/constants/spacing';
import { ScreenHeader } from '../../../src/components/layout/ScreenHeader';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useCreateTask } from '../../../src/hooks/useTasks';
import { getErrorMessage } from '../../../src/utils/errorHandler';

export default function CreateTaskScreen() {
  const router = useRouter();
  const { mutate: createTask, isPending, error } = useCreateTask();

  const { control, handleSubmit, formState: { errors } } = useForm<CreateTaskDto>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
    },
  });

  const onSubmit = (data: CreateTaskDto) => {
    createTask(data, {
      onSuccess: () => {
        Alert.alert('Success', 'Task created successfully');
        router.back();
      },
      onError: (err) => {
        Alert.alert('Error', getErrorMessage(err));
      },
    });
  };

  return (
    <SafeScreen>
      <ScreenHeader title="Create Task" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Task Title"
              placeholder="Enter task title"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.title?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Description (optional)"
              placeholder="Describe the task..."
              multiline
              numberOfLines={4}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ''}
              error={errors.description?.message}
              style={{ height: 100, textAlignVertical: 'top' }}
            />
          )}
        />

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
          </View>
        )}

        <Button
          label={isPending ? 'Creating...' : 'Create Task'}
          loading={isPending}
          fullWidth
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing[4], gap: Spacing[5], paddingBottom: Spacing[10] },
  errorBox: { backgroundColor: Colors.semantic.errorBg, borderRadius: 8, padding: Spacing[4] },
  errorText: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.semantic.error },
});
