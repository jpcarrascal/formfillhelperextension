#!/usr/bin/env python3
"""
Create icons for Band Info Quick Copy Extension
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """Create a single icon with the specified size"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors
    bg_color = (45, 123, 187)  # Modern blue
    accent_color = (255, 255, 255)  # White
    shadow_color = (30, 80, 120)  # Darker blue for depth
    
    # Background circle with gradient effect
    margin = size // 10
    circle_radius = (size - 2 * margin) // 2
    center = size // 2
    
    # Draw shadow circle (slightly offset)
    shadow_offset = max(1, size // 32)
    draw.ellipse([
        center - circle_radius + shadow_offset,
        center - circle_radius + shadow_offset,
        center + circle_radius + shadow_offset,
        center + circle_radius + shadow_offset
    ], fill=shadow_color + (180,))
    
    # Draw main circle
    draw.ellipse([
        center - circle_radius,
        center - circle_radius,
        center + circle_radius,
        center + circle_radius
    ], fill=bg_color)
    
    # Draw musical note
    note_size = size // 3
    note_x = center - note_size // 4
    note_y = center - note_size // 3
    
    # Note stem
    stem_width = max(2, size // 20)
    stem_height = note_size
    draw.rectangle([
        note_x + note_size // 3,
        note_y,
        note_x + note_size // 3 + stem_width,
        note_y + stem_height
    ], fill=accent_color)
    
    # Note head (oval)
    head_width = note_size // 2
    head_height = note_size // 3
    draw.ellipse([
        note_x,
        note_y + stem_height - head_height,
        note_x + head_width,
        note_y + stem_height
    ], fill=accent_color)
    
    # Flag (curved line)
    flag_points = []
    flag_start_x = note_x + note_size // 3 + stem_width
    flag_start_y = note_y
    
    # Create curved flag
    for i in range(note_size // 2):
        x = flag_start_x + (i * size // 40)
        y = flag_start_y + (i * 2)
        flag_points.append((x, y))
    
    if len(flag_points) > 1:
        for i in range(len(flag_points) - 1):
            draw.line([flag_points[i], flag_points[i + 1]], fill=accent_color, width=max(2, size // 25))
    
    # Add small copy/document symbol in corner
    copy_size = size // 4
    copy_x = center + circle_radius // 2
    copy_y = center + circle_radius // 2
    
    # Small document outline
    doc_width = copy_size // 2
    doc_height = copy_size // 2
    draw.rectangle([
        copy_x - doc_width // 2,
        copy_y - doc_height // 2,
        copy_x + doc_width // 2,
        copy_y + doc_height // 2
    ], outline=accent_color, width=max(1, size // 32))
    
    # Small lines inside document
    line_spacing = max(2, size // 40)
    for i in range(2):
        y_pos = copy_y - doc_height // 4 + (i * line_spacing)
        draw.line([
            copy_x - doc_width // 3,
            y_pos,
            copy_x + doc_width // 3,
            y_pos
        ], fill=accent_color, width=max(1, size // 48))
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    """Create all required icon sizes"""
    # Standard Chrome extension icon sizes
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        filename = f"icon{size}.png"
        create_icon(size, filename)
    
    print("\n✅ All icons created successfully!")
    print("Icons feature a modern musical note with copy symbol design")
    print("Color scheme: Modern blue background with white elements")

if __name__ == "__main__":
    main()