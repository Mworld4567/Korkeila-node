/**
 * Helper functions for image handling
 * Extracts filename from URLs/paths and constructs full URLs from filenames
 */

/**
 * Get current timezone offset in seconds
 * @returns {number} - Timezone offset in seconds (positive for UTC+, negative for UTC-)
 */
const getTimezoneOffsetSeconds = () => {
    // getTimezoneOffset() returns offset in minutes, negative for UTC+
    // We need to negate it and convert to seconds
    return -new Date().getTimezoneOffset() * 60;
};

/**
 * Append timezone offset in seconds to filename
 * @param {string} filename - Original filename (e.g., "image.jpg")
 * @returns {string} - Filename with timezone appended (e.g., "image_19800.jpg")
 */
const appendTimezoneToFilename = (filename) => {
    if (!filename) return filename;
    
    // If filename already has timezone appended (contains pattern like _19800 or _-19800), return as is
    // Pattern matches: _ followed by optional + or -, then digits, then dot and extension
    if (filename.match(/_[+-]?\d+\.(jpg|jpeg|png|gif|svg|webp|jfif|bmp|ico|tiff|tif)$/i)) {
        return filename;
    }
    
    const timezoneOffset = getTimezoneOffsetSeconds();
    const lastDotIndex = filename.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
        // No extension, just append timezone
        return `${filename}_${timezoneOffset}`;
    }
    
    const namePart = filename.substring(0, lastDotIndex);
    const extension = filename.substring(lastDotIndex);
    return `${namePart}_${timezoneOffset}${extension}`;
};

/**
 * Extract only the filename (last part) from URL or path
 * @param {string} imagePath - Full URL, path, or filename
 * @returns {string|null} - Extracted filename only (e.g., "image.jpg")
 */
const extractFilename = (imagePath) => {
    if (!imagePath) return null;

    let path = imagePath;

    // If it's a full URL, extract the pathname
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        try {
            const url = new URL(imagePath);
            path = url.pathname;
        } catch (error) {
            // If URL parsing fails, try to extract path manually
            const urlMatch = imagePath.match(/https?:\/\/[^\/]+(\/.*)/);
            if (urlMatch) {
                path = urlMatch[1];
            }
        }
    }

    // Remove leading slash
    if (path.startsWith('/')) {
        path = path.substring(1);
    }

    // Remove 'public/' prefix if present
    if (path.startsWith('public/')) {
        path = path.substring(7);
    }

    // Extract only the last part (filename) - everything after the last '/'
    const parts = path.split('/');
    const filename = parts[parts.length - 1];

    return filename || null;
};

/**
 * Construct full URL from filename
 * @param {string} filename - Filename only (e.g., "image.jpg")
 * @param {string} routeName - Optional route name (e.g., "cutMaster", "categoryMaster", "product")
 * @returns {string|null} - Full URL to the image
 */
const constructImageUrl = (filename, routeName = null) => {
    if (!filename) return null;

    // If it's already a full URL, return as is (for backward compatibility)
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
        return filename;
    }

    const cloudfrontUrl = process.env.AWS_URL;
    if (!cloudfrontUrl) {
        console.warn('AWS_URL environment variable is not set');
        return filename;
    }

    // Append timezone offset to filename if not already present
    const filenameWithTimezone = appendTimezoneToFilename(filename);

    const baseUrl = cloudfrontUrl.endsWith('/') ? cloudfrontUrl : `${cloudfrontUrl}/`;
    
    // If routeName is provided, construct path: {routeName}/image/{filename}
    // Otherwise, assume filename might already contain path (for backward compatibility)
    if (routeName) {
        return `${baseUrl}${routeName}/image/${filenameWithTimezone}`;
    }
    
    // For backward compatibility: if filename contains path, use it as is
    // Otherwise, just append filename (this handles old data that might have paths)
    return `${baseUrl}${filenameWithTimezone}`;
};

module.exports = {
    extractFilename,
    constructImageUrl,
    appendTimezoneToFilename,
    getTimezoneOffsetSeconds
};
