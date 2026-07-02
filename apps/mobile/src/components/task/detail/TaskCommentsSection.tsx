import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as Haptics from 'expo-haptics';

dayjs.extend(relativeTime);

import type { TaskComment } from '@godigitify/types';

import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, Layout } from '../../../constants/spacing';
import { Avatar } from '../../ui/Avatar';

const PREVIEW_COUNT = 3;

type Props = {
  comments: TaskComment[];
  currentUserId: string;
  currentUserName: string;
  onSubmit: (content: string) => void | Promise<void>;
  isSubmitting?: boolean;
  onSeeAll?: () => void;
};

export const TaskCommentsSection = React.memo(
  ({ comments, currentUserId, currentUserName, onSubmit, isSubmitting, onSeeAll }: Props) => {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onSubmit(trimmed);
    setText('');
    inputRef.current?.blur();
  }, [text, isSubmitting, onSubmit]);

  const preview = comments.slice(0, PREVIEW_COUNT);
  const hasMore = comments.length > PREVIEW_COUNT;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="message-circle" size={16} color={Colors.brand.primary} />
          <Text style={styles.title}>Comments</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{comments.length}</Text>
          </View>
        </View>
        {hasMore && onSeeAll && (
          <Pressable onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        )}
      </View>

      {/* Comment list */}
      {comments.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Feather name="message-circle" size={28} color={Colors.text.tertiary} />
          <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {preview.map((comment) => (
            <CommentRow key={comment.id} comment={comment} currentUserId={currentUserId} />
          ))}
          {hasMore && (
            <Pressable onPress={onSeeAll} style={styles.moreBtn}>
              <Text style={styles.moreText}>
                +{comments.length - PREVIEW_COUNT} more comments
              </Text>
              <Feather name="chevron-right" size={14} color={Colors.brand.primary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Comment input */}
      <View style={styles.inputRow}>
        <Avatar name={currentUserName} size={32} />
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Add a comment... (@mention to tag)"
            placeholderTextColor={Colors.text.tertiary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || isSubmitting}
          style={({ pressed }) => [
            styles.sendBtn,
            { backgroundColor: text.trim() ? Colors.brand.primary : Colors.surface.background },
            pressed && { opacity: 0.8 },
          ]}
          accessibilityLabel="Send comment"
        >
          <Feather
            name="send"
            size={16}
            color={text.trim() ? Colors.text.inverse : Colors.text.tertiary}
          />
        </Pressable>
      </View>
    </View>
  );
});

// ─── CommentRow ───────────────────────────────────────────────────────────────
const CommentRow = React.memo(({ comment, currentUserId }: { comment: TaskComment; currentUserId: string }) => {
  const isMe = comment.author.id === currentUserId;

  const renderContent = (content: string) => {
    const parts = content.split(/(@\w[\w\s.]+)/g);
    return parts.map((part, i) =>
      part.startsWith('@') ? (
        <Text key={i} style={styles.mention}>
          {part}
        </Text>
      ) : (
        <Text key={i}>{part}</Text>
      )
    );
  };

  return (
    <View style={styles.commentRow}>
      <Avatar name={comment.author.name} size={32} />
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.authorName}>
            {isMe ? 'You' : comment.author.name}
          </Text>
          {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
            <Text style={styles.editedTag}>(edited)</Text>
          )}
          <Text style={styles.timestamp}>
            {dayjs(comment.createdAt).fromNow()}
          </Text>
        </View>
        <Text style={styles.commentText}>
          {renderContent(comment.content)}
        </Text>
      </View>
    </View>
  );
});

CommentRow.displayName = 'CommentRow';
TaskCommentsSection.displayName = 'TaskCommentsSection';

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  countBadge: {
    backgroundColor: Colors.brand.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Bold',
    color: Colors.brand.primary,
  },
  seeAll: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
    color: Colors.brand.primary,
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
  },
  emptyText: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
  },

  // List
  list: { gap: Spacing[4] },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: Spacing[2],
  },
  moreText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
    color: Colors.brand.primary,
  },

  // Comment row
  commentRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    alignItems: 'flex-start',
  },
  commentBody: { flex: 1, gap: 4 },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  authorName: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  editedTag: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
  },
  timestamp: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
    marginLeft: 'auto',
  },
  commentText: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  mention: {
    color: Colors.brand.primary,
    fontFamily: 'Inter-Medium',
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.surface.border,
    paddingTop: Spacing[3],
  },
  inputWrap: {
    flex: 1,
    backgroundColor: Colors.surface.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    minHeight: 40,
  },
  input: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
});
