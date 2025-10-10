// Validation functions for story operations

export const validateCreateStory = (data: any) => {
  const errors: string[] = [];

  // Required fields
  if (!data.mediaUrl || typeof data.mediaUrl !== "string" || !data.mediaUrl.trim()) {
    errors.push("Media URL is required");
  }

  // MediaType validation
  if (data.mediaType && !["image", "video"].includes(data.mediaType)) {
    errors.push('Media type must be either "image" or "video"');
  }

  // Caption validation
  if (data.caption && typeof data.caption === "string" && data.caption.length > 500) {
    errors.push("Caption cannot exceed 500 characters");
  }

  // Background color validation
  if (data.backgroundColor && !/^#[0-9A-Fa-f]{6}$/.test(data.backgroundColor)) {
    errors.push("Invalid background color format. Use hex format like #FF0000");
  }

  // Location validation
  if (data.location) {
    if (typeof data.location !== "object") {
      errors.push("Location must be an object");
    } else {
      if (
        data.location.name &&
        (typeof data.location.name !== "string" || !data.location.name.trim())
      ) {
        errors.push("Location name must be a non-empty string");
      }

      if (data.location.coordinates) {
        if (!Array.isArray(data.location.coordinates)) {
          errors.push("Location coordinates must be an array");
        } else if (data.location.coordinates.length > 0 && data.location.coordinates.length !== 2) {
          errors.push("Location coordinates must be [longitude, latitude] or empty array");
        } else if (data.location.coordinates.length === 2) {
          const [lng, lat] = data.location.coordinates;
          if (typeof lng !== "number" || typeof lat !== "number") {
            errors.push("Coordinates must be numbers");
          }
          if (lng < -180 || lng > 180) {
            errors.push("Longitude must be between -180 and 180");
          }
          if (lat < -90 || lat > 90) {
            errors.push("Latitude must be between -90 and 90");
          }
        }
      }
    }
  }

  // Mentions validation
  if (data.mentions && Array.isArray(data.mentions)) {
    data.mentions.forEach((mention: any, index: number) => {
      if (typeof mention !== "string" || !/^[0-9a-fA-F]{24}$/.test(mention)) {
        errors.push(`Invalid mention at index ${index}. Must be a valid ObjectId`);
      }
    });
  }

  // Tags validation
  if (data.tags && Array.isArray(data.tags)) {
    data.tags.forEach((tag: any, index: number) => {
      if (typeof tag !== "string") {
        errors.push(`Tag at index ${index} must be a string`);
      } else if (tag.length > 50) {
        errors.push(`Tag at index ${index} cannot exceed 50 characters`);
      }
    });
  }

  // Duration validation
  if (data.duration !== undefined) {
    if (typeof data.duration !== "number" || data.duration < 1 || data.duration > 48) {
      errors.push("Duration must be a number between 1 and 48 hours");
    }
  }

  return errors;
};

export const validateStoryId = (storyId: string) => {
  if (!storyId || typeof storyId !== "string" || !/^[0-9a-fA-F]{24}$/.test(storyId)) {
    return ["Invalid story ID format"];
  }
  return [];
};

export const validateUsername = (username: string) => {
  if (!username || typeof username !== "string" || !username.trim()) {
    return ["Username is required"];
  }
  return [];
};

export const validateHighlight = (data: any) => {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
    errors.push("Highlight title is required");
  } else if (data.title.length > 50) {
    errors.push("Highlight title cannot exceed 50 characters");
  }

  if (!data.storyIds || !Array.isArray(data.storyIds) || data.storyIds.length === 0) {
    errors.push("At least one story ID is required");
  } else {
    data.storyIds.forEach((storyId: any, index: number) => {
      if (typeof storyId !== "string" || !/^[0-9a-fA-F]{24}$/.test(storyId)) {
        errors.push(`Invalid story ID at index ${index}`);
      }
    });
  }

  return errors;
};
