
from PIL import Image
import numpy as np

input_path = 'public/smaka-pa-alvsjo.jpg'
output_path = 'public/smaka-pa-alvsjo.png'

# Open image and convert to RGBA
img = Image.open(input_path).convert('RGBA')
img_array = np.array(img)

# Create a mask for pure white pixels (very strict threshold)
# R > 252, G > 252, B > 252 to preserve near-white colors in the logo
white_mask = (img_array[:,:,0] > 252) & (img_array[:,:,1] > 252) & (img_array[:,:,2] > 252)

# Only make the border white transparent
# Start from edges and grow inward, but stop if we hit non-white pixels
height, width = white_mask.shape
border_mask = np.zeros_like(white_mask, dtype=bool)

# Mark edges as starting point
border_mask[0, :] = white_mask[0, :]
border_mask[-1, :] = white_mask[-1, :]
border_mask[:, 0] = white_mask[:, 0]
border_mask[:, -1] = white_mask[:, -1]

# Grow the border inward (simple dilation within white areas only)
from scipy import ndimage
border_mask = ndimage.binary_dilation(border_mask & white_mask, iterations=50)

# Apply transparency only to border white areas
img_array[border_mask, 3] = 0

result = Image.fromarray(img_array, 'RGBA')
result.save(output_path, 'PNG')
print('Conversion complete: border white made transparent, internal white preserved.')
