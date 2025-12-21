/**
 * Helper functions for image handling
 * Extracts filename from URLs/paths and constructs full URLs from filenames
 */

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

    const baseUrl = cloudfrontUrl.endsWith('/') ? cloudfrontUrl : `${cloudfrontUrl}/`;
    
    // If routeName is provided, construct path: {routeName}/image/{filename}
    // Otherwise, assume filename might already contain path (for backward compatibility)
    if (routeName) {
        return `${baseUrl}${routeName}/image/${filename}`;
    }
    
    // For backward compatibility: if filename contains path, use it as is
    // Otherwise, just append filename (this handles old data that might have paths)
    return `${baseUrl}${filename}`;
};

module.exports = {
    extractFilename,
    constructImageUrl
};
