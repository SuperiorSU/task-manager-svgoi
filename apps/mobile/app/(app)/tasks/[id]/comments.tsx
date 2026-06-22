import React, { useRef, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { Colors } from '../../../../src/constants/colors';
import { Typography } from '../../../../src/constants/typography';
import { Spacing, Layout } from '../../../../src/constants/spacing';
import { ScreenHeader } from '../../../../src/components/layout/ScreenHeader';
import { Avatar } from '../../../../src/components/ui/Avatar';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { Skeleton } from '../../../../src/components/ui/Skeleton';
import { useTaskComments, useAddComment } from '../../../../src/hooks/useTasks';

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; avatarUrl?: string | null };
};

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { data, isLoading } = useTaskComments(id);
  const { mutate: addComment, isPending } = useAddComment(id);

  const comments = (data ?? []) as Comment[];

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    addComment({ content: trimmed }, {
      onSuccess: () => {
        setText('');
        inputRef.current?.blur();
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.surface.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title="Comments" showBack />

      <FlatList
        data={isLoading ? [] : comments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing[3] }} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: Spacing[3] }}>
              <Skeleton height={72} borderRadius={12} />
              <Skeleton height={72} borderRadius={12} />
            </View>
          ) : (
            <EmptyState icon="message-circle" title="No comments yet" subtitle="Be the first to comment" />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <Avatar name={item.author.name} uri={item.author.avatarUrl} size={36} />
            <View style={styles.commentBody}>
              <View style={styles.commentHeader}>
                <Text style={styles.authorName}>{item.author.name}</Text>
                <Text style={styles.timestamp}>{dayjs(item.createdAt).fromNow()}</Text>
              </View>
              <Text style={styles.commentText}>{item.content}</Text>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Reply bar */}
      <View style={styles.replyBar}>
        <TextInput
          ref={inputRef}
          style={styles.replyInput}
          placeholder="Add a comment..."
          placeholderTextColor={Colors.text.tertiary}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || isPending}
          style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Send comment"
        >
          <Feather
            name="send"
            size={20}
            color={text.trim() && !isPending ? Colors.brand.primary : Colors.text.tertiary}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing[4], paddingBottom: Spacing[4] },
  commentCard: {
    flexDirection: 'row',
    gap: Spacing[3],
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
  },
  commentBody: { flex: 1, gap: Spacing[1] },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorName: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold', color: Colors.text.primary },
  timestamp: { ...Typography.caption, fontFamily: 'Inter-Regular', color: Colors.text.tertiary },
  commentText: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.text.secondary, lineHeight: 22 },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.surface.border,
    backgroundColor: Colors.surface.card,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Platform.OS === 'ios' ? Spacing[6] : Spacing[3],
  },
  replyInput: {
    flex: 1,
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
    maxHeight: 120,
    paddingTop: 0,
  },
  sendBtn: {
    padding: Spacing[2],
    marginBottom: 2,
  },
});
