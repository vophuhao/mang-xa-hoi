# Comment Reply Feature Implementation

## Overview

Đã hoàn thành tính năng trả lời comment theo UI requirements với khả năng:

- Hiển thị replies nested dưới parent comment
- Load replies theo pagination (5 replies per page)
- Mention @username trong replies
- UI giống hình mẫu đã gửi

## Backend Changes

### 1. API Enhancements

- **GET /comments/:commentId/replies**: Đã cập nhật để support pagination với `page` và `limit`
- **POST /comments/post/:postId**: Đã support `parentId` để tạo reply

### 2. Database Logic Updates

- **Comment creation**: Tự động increment `replyCount` của parent comment khi tạo reply
- **Comment deletion**: Tự động decrement `replyCount` của parent comment khi xóa reply
- **Reply queries**: Include `isLiked` status cho replies

### 3. Service Layer Changes

**File: `server/src/services/comment.service.ts`**

```typescript
// Enhanced createComment with reply counting
static async createComment({ content, postId, userId, parentId }: CreateCommentParams) {
  // ... existing logic

  if (parentId) {
    const parentComment = await CommentModel.findById(parentId).populate("user");
    if (parentComment) {
      // Increment reply count on parent comment
      await parentComment.incrementReply();
      // ... notification logic
    }
  }
}

// Enhanced getCommentReplies with like status
static async getCommentReplies(commentId: string, page: number = 1, limit: number = 10, userId?: string) {
  // ... pagination logic

  // Add isLiked field for each reply if userId is provided
  if (userId) {
    const repliesWithLike = await Promise.all(
      replies.map(async reply => {
        const isLiked = await LikeModel.exists({
          user: userId,
          comment: reply._id,
        });
        return { ...reply.toObject(), isLiked: !!isLiked };
      })
    );
    repliesWithLikeStatus = repliesWithLike as any;
  }
}
```

## Frontend Changes

### 1. API Client Updates

**File: `web/src/lib/api.js`**

```javascript
// Enhanced getCommentReplies with pagination support
export const getCommentReplies = async (
  commentId,
  { page = 1, limit = 5 } = {}
) => {
  const response = await API.get(
    `/comments/${commentId}/replies?page=${page}&limit=${limit}`
  );
  return response;
};
```

### 2. React Query Hooks

**File: `web/src/hooks/useComment.js`**

```javascript
// New hook for infinite loading replies
export const useInfiniteCommentReplies = (commentId, limit = 5) => {
  return useInfiniteQuery({
    queryKey: COMMENT_QUERY_KEYS.repliesInfinite(commentId),
    queryFn: ({ pageParam = 1 }) => getCommentReplies(commentId, { page: pageParam, limit }),
    enabled: !!commentId,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      return pagination?.hasNext ? pagination.page + 1 : undefined;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Enhanced useAddComment to support parentId
mutationFn: ({ postId, content, parentId }) => addComment(postId, { content, parentId }),
```

### 3. Component Updates

#### CommentItem Component

**File: `web/src/components/feed/CommentItem.jsx`**

**New Features:**

- **Nested Replies Display**: Shows replies as indented sub-comments
- **@Username Mentions**: Parses content để highlight @username với màu xanh
- **Show/Hide Replies**: Button "Xem câu trả lời (x)" / "Ẩn câu trả lời"
- **Load More Replies**: Pagination button "Xem thêm câu trả lời"

**Key Functions:**

```javascript
// Format content with clickable @username mentions
const formatContentWithMentions = (content) => {
  const mentionRegex = /@(\w+)/g;
  const parts = content.split(mentionRegex);

  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <span
          key={index}
          className="cursor-pointer text-blue-600 hover:underline dark:text-blue-400"
          onClick={() => onUsernameClick?.({ username: part })}
        >
          @{part}
        </span>
      );
    }
    return part;
  });
};

// Toggle replies visibility
const toggleReplies = () => {
  setShowReplies(!showReplies);
};
```

#### CommentInput Component

**File: `web/src/components/feed/CommentInput.jsx`**

**New Features:**

- **Reply Mode**: Accepts `parentId`, `initialContent`, `onReplyCancel`
- **Reply Indicator**: Shows "Đang trả lời bình luận..." banner khi reply
- **Auto Focus**: Tự động focus và set cursor position khi reply
- **ESC Cancel**: Nhấn ESC để cancel reply

#### PostModal Component

**File: `web/src/components/feed/PostModal.jsx`**

**New Features:**

- **Reply State Management**: Manages reply state giữa CommentList và CommentInput
- **Dynamic Placeholder**: Changes placeholder text khi reply

```javascript
// Reply state structure
const [replyState, setReplyState] = useState(null);
// {
//   parentId: string,
//   parentUsername: string,
//   initialContent: string
// }
```

## UI/UX Features

### 1. Visual Design

- **Nested Layout**: Replies indented với `ml-2` để phân biệt level
- **@Username Styling**: Color `text-blue-600` cho mentions, clickable
- **Reply Counter**: Shows "(x)" next to "Xem câu trả lời"
- **Loading States**: Skeleton loading cho replies

### 2. User Interactions

- **Click "Trả lời"**: Focus input với @username prefix
- **Click "Xem câu trả lời (x)"**: Load và expand replies (5 per page)
- **Click "Xem thêm câu trả lời"**: Load next page of replies
- **Click @username**: Navigate đến profile user
- **ESC key**: Cancel reply mode

### 3. Performance Optimizations

- **Lazy Loading**: Replies chỉ load khi user click "Xem câu trả lời"
- **Pagination**: Load 5 replies per request thay vì tất cả
- **Infinite Scroll**: Support load more replies khi cần
- **Query Invalidation**: Auto refresh related queries khi có reply mới

## Testing Recommendations

1. **Reply Creation**: Test tạo reply với @mentions
2. **Nested Display**: Verify replies hiển thị đúng indentation
3. **Pagination**: Test load more replies functionality
4. **Like Functionality**: Test like/unlike replies
5. **Delete Cascade**: Test delete parent comment removes all replies
6. **Notification**: Test reply notifications
7. **Performance**: Test with many replies (100+)

## Usage Example

```javascript
// User clicks "Trả lời" on a comment
handleReply(comment) ->
  setReplyState({
    parentId: comment._id,
    parentUsername: comment.user.username,
    initialContent: `@${comment.user.username} `
  })

// User submits reply
addComment({
  postId: "post123",
  content: "@john Hello there!",
  parentId: "comment456"
})

// System updates:
// 1. Creates new reply comment
// 2. Increments parent comment replyCount
// 3. Invalidates comment queries
// 4. Shows reply in UI immediately
```

## Database Schema Impact

Comments model already supports the reply system with:

- `parentComment`: ObjectId reference to parent comment
- `replyCount`: Number of direct replies
- `isReply`: Boolean flag computed from parentComment existence
- Virtual `replies` field for population

No migration needed as schema was already in place.
