import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def generate_instagram_icon(size=24):
    scale = 4
    s = size * scale
    base = Image.new('RGB', (s, s), (225, 48, 108))
    
    for y in range(s):
        ty = y / s
        for x in range(0, s, 2):
            tx = x / s
            diag = (tx + (1.0 - ty)) / 2.0
            if diag < 0.45:
                t = diag / 0.45
                r = int(253 * (1 - t) + 225 * t)
                g = int(175 * (1 - t) + 48 * t)
                b = int(69 * (1 - t) + 108 * t)
            else:
                t = (diag - 0.45) / 0.55
                r = int(225 * (1 - t) + 131 * t)
                g = int(48 * (1 - t) + 58 * t)
                b = int(108 * (1 - t) + 180 * t)
            base.putpixel((x, y), (r, g, b))
            if x + 1 < s:
                base.putpixel((x + 1, y), (r, g, b))

    mask = Image.new('L', (s, s), 0)
    d_mask = ImageDraw.Draw(mask)
    d_mask.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.28), fill=255)
    
    icon_rgba = base.convert('RGBA')
    icon_rgba.putalpha(mask)
    
    d_cam = ImageDraw.Draw(icon_rgba)
    stroke_w = max(2, int(s * 0.08))
    margin = int(s * 0.22)
    cam_radius = int(s * 0.17)
    d_cam.rounded_rectangle(
        [margin, margin, s - margin - 1, s - margin - 1],
        radius=cam_radius,
        outline=(255, 255, 255, 255),
        width=stroke_w
    )
    center_r = int(s * 0.19)
    cx, cy = s // 2, s // 2
    d_cam.ellipse(
        [cx - center_r, cy - center_r, cx + center_r, cy + center_r],
        outline=(255, 255, 255, 255),
        width=stroke_w
    )
    dot_r = max(2, int(s * 0.038))
    dot_x = s - margin - int(s * 0.08)
    dot_y = margin + int(s * 0.08)
    d_cam.ellipse(
        [dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r],
        fill=(255, 255, 255, 255)
    )
    return icon_rgba.resize((size, size), Image.Resampling.LANCZOS)

def create_flawless_og_banner():
    W = 1200
    H = 630

    # 1. Background Canvas: Deep Obsidian Navy
    bg = Image.new('RGBA', (W, H), (8, 14, 26, 255)) # #080E1A

    # Ambient radial light glows
    # Cyan/blue ambient glow on top-left / center
    glow1 = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d1 = ImageDraw.Draw(glow1)
    d1.ellipse([-80, -80, 680, 680], fill=(0, 102, 255, 45)) # #0066FF
    d1.ellipse([160, 100, 780, 720], fill=(0, 190, 255, 28))
    glow1 = glow1.filter(ImageFilter.GaussianBlur(130))
    bg.alpha_composite(glow1)

    # Warm amber/orange glow on top-right / right side
    glow2 = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(glow2)
    d2.ellipse([700, -70, 1340, 540], fill=(255, 120, 0, 36)) # Orange glow
    d2.ellipse([800, 200, 1380, 750], fill=(0, 102, 255, 26))
    glow2 = glow2.filter(ImageFilter.GaussianBlur(140))
    bg.alpha_composite(glow2)

    # Subtle modern grid lines
    grid_overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d_grid = ImageDraw.Draw(grid_overlay)
    step = 40
    for x in range(0, W, step):
        d_grid.line([(x, 0), (x, H)], fill=(255, 255, 255, 6), width=1)
    for y in range(0, H, step):
        d_grid.line([(0, y), (W, y)], fill=(255, 255, 255, 6), width=1)
    bg.alpha_composite(grid_overlay)

    # 2. Typography Fonts
    font_bold_path = r"C:\Windows\Fonts\segoeuib.ttf"
    font_reg_path = r"C:\Windows\Fonts\segoeui.ttf"

    font_brand = ImageFont.truetype(font_bold_path, 36)
    font_badge = ImageFont.truetype(font_bold_path, 12)
    font_hero_1 = ImageFont.truetype(font_bold_path, 46)
    font_hero_2 = ImageFont.truetype(font_bold_path, 46)
    font_sub_1 = ImageFont.truetype(font_bold_path, 17)
    font_sub_2 = ImageFont.truetype(font_reg_path, 16)
    font_pill = ImageFont.truetype(font_bold_path, 13)
    font_app_label = ImageFont.truetype(font_bold_path, 12)
    font_url = ImageFont.truetype(font_bold_path, 13)

    draw = ImageDraw.Draw(bg)

    # 3. Official Brand Logo at Top-Left (x=70, y=50)
    mark_img = Image.open('public/logos/mymobpay_mark.png').convert('RGBA')
    mark_bbox = mark_img.getbbox()
    mark_crop = mark_img.crop(mark_bbox)
    
    mark_h = 52
    mark_w = int(mark_h * (mark_crop.size[0] / mark_crop.size[1]))
    mark_res = mark_crop.resize((mark_w, mark_h), Image.Resampling.LANCZOS)
    
    logo_x = 70
    logo_y = 50
    bg.paste(mark_res, (logo_x, logo_y), mark_res)
    
    # Text "MyMobPay"
    text_x = logo_x + mark_w + 14
    draw.text((text_x, logo_y + 4), "MyMobPay", font=font_brand, fill=(255, 255, 255, 255))

    # -------------------------------------------------------------
    # 4. FIX: "DIRECT SETTLEMENT GATEWAY" Badge (High Contrast & Glowing)
    # -------------------------------------------------------------
    badge_text = "DIRECT SETTLEMENT GATEWAY"
    tb_badge = draw.textbbox((0, 0), badge_text, font=font_badge)
    badge_w = tb_badge[2] - tb_badge[0] + 36
    badge_h = 30
    badge_x = text_x + 205
    badge_y = logo_y + 12

    # Luminous dark emerald glass pill with glowing green border
    draw.rounded_rectangle(
        [badge_x, badge_y, badge_x + badge_w, badge_y + badge_h],
        radius=15,
        fill=(6, 78, 59, 230), # Deep rich emerald background
        outline=(52, 211, 153, 255), # Bright glowing emerald border
        width=1
    )
    # Pulsating green live indicator dot
    draw.ellipse([badge_x + 12, badge_y + 10, badge_x + 22, badge_y + 20], fill=(52, 211, 153, 255))
    draw.ellipse([badge_x + 14, badge_y + 12, badge_x + 20, badge_y + 18], fill=(255, 255, 255, 255))
    # Crisp, bright pure white text for maximum readability
    draw.text((badge_x + 28, badge_y + 6), badge_text, font=font_badge, fill=(255, 255, 255, 255))

    # 5. Hero Headline (x=70, y=140)
    draw.text((70, 138), "Accept Direct UPI Payments", font=font_hero_1, fill=(255, 255, 255, 255))
    draw.text((70, 194), "With 0% Gateway Fees.", font=font_hero_2, fill=(56, 189, 248, 255)) # Sky Blue #38BDF8

    # 6. Subtitle (x=70, y=268)
    draw.text((70, 268), "Direct bank settlements to your personal or business UPI ID.", font=font_sub_1, fill=(241, 245, 249, 255))
    draw.text((70, 296), "Instant auto-verification, signed webhooks & zero intermediaries.", font=font_sub_2, fill=(148, 163, 184, 255))

    # 7. Feature Pills (x=70, y=350) - Dark glass badges with colored glowing borders
    features = [
        ("Instant Bank Credit", (14, 165, 233)), # Sky Blue
        ("Zero Intermediaries", (16, 185, 129)), # Emerald
        ("< 200ms Webhook", (249, 115, 22))    # Orange
    ]
    cur_x = 70
    p_y = 350
    for feat_text, color in features:
        tb = draw.textbbox((0, 0), feat_text, font=font_pill)
        box_w = tb[2] - tb[0] + 36
        draw.rounded_rectangle([cur_x, p_y, cur_x + box_w, p_y + 34], radius=17, fill=(15, 23, 42, 230), outline=(color[0], color[1], color[2], 180), width=1)
        # Colored indicator dot
        draw.ellipse([cur_x + 12, p_y + 12, cur_x + 21, p_y + 21], fill=(color[0], color[1], color[2], 255))
        draw.text((cur_x + 27, p_y + 8), feat_text, font=font_pill, fill=(255, 255, 255, 255))
        cur_x += box_w + 14

    # -------------------------------------------------------------
    # 8. FIX: SPOTLESS 4 UPI APP SQUIRCLE LOGOS (GPay, PhonePe, Paytm, BHIM)
    # -------------------------------------------------------------
    draw.text((70, 426), "ACCEPTED UPI PAYMENT APPS", font=ImageFont.truetype(font_bold_path, 11), fill=(148, 163, 184, 255))

    old_orig = Image.open(r'C:\Users\chauh\.gemini\antigravity-ide\brain\91cbf931-7fc1-4e94-9ebb-0883ffe63265\old_og_banner.png')
    
    # Precise card extractions
    raw_cards = [
        ('gpay', 64, 913, 113, 962),
        ('phonepe', 139, 913, 188, 962),
        ('paytm', 214, 913, 263, 962),
        ('bhim', 289, 913, 338, 962)
    ]

    card_display_size = 52
    icon_x = 70
    icon_y = 452

    for name, x1, y1, x2, y2 in raw_cards:
        inner = old_orig.crop((x1, y1, x2, y2)).convert('RGBA')
        
        # Clean stray grey edge pixels: if pixel is close to grey background (r~120-135, g~120-135, b~140-150), make white
        inner_pix = inner.load()
        w_in, h_in = inner.size
        for ix in range(w_in):
            for iy in range(h_in):
                r, g, b, a = inner_pix[ix, iy]
                if abs(r - 124) < 15 and abs(g - 130) < 15 and abs(b - 146) < 15:
                    inner_pix[ix, iy] = (255, 255, 255, 255)
        
        inner_res = inner.resize((44, 44), Image.Resampling.LANCZOS)

        # Create pure white squircle card with smooth rounded corners
        app_card = Image.new('RGBA', (card_display_size, card_display_size), (0, 0, 0, 0))
        d_ac = ImageDraw.Draw(app_card)
        d_ac.rounded_rectangle([0, 0, card_display_size - 1, card_display_size - 1], radius=13, fill=(255, 255, 255, 255), outline=(255, 255, 255, 140), width=1)
        
        # Paste logo centered inside white squircle
        app_card.paste(inner_res, (4, 4), inner_res)

        # Draw subtle drop shadow on canvas before pasting
        shadow_box = Image.new('RGBA', (card_display_size + 6, card_display_size + 6), (0, 0, 0, 0))
        d_sb = ImageDraw.Draw(shadow_box)
        d_sb.rounded_rectangle([2, 2, card_display_size + 3, card_display_size + 3], radius=14, fill=(0, 0, 0, 100))
        shadow_box = shadow_box.filter(ImageFilter.GaussianBlur(3))
        bg.alpha_composite(shadow_box, (icon_x - 3, icon_y - 1))

        # Paste clean card
        bg.paste(app_card, (icon_x, icon_y), app_card)
        icon_x += card_display_size + 16

    # Add "+ All Indian Bank UPIs" pill next to the 4 logos
    any_box_w = 160
    draw.rounded_rectangle(
        [icon_x, icon_y + 6, icon_x + any_box_w, icon_y + card_display_size - 6],
        radius=12,
        fill=(15, 23, 42, 230),
        outline=(255, 255, 255, 60),
        width=1
    )
    draw.text((icon_x + 16, icon_y + 13), "+ All Bank UPI Apps", font=font_app_label, fill=(241, 245, 249, 255))

    # 9. Bottom bar info (x=70, y=546)
    # Website pill: mymob.tech
    web_pill_x = 70
    web_pill_y = 546
    web_pill_w = 148
    web_pill_h = 36
    draw.rounded_rectangle(
        [web_pill_x, web_pill_y, web_pill_x + web_pill_w, web_pill_y + web_pill_h],
        radius=10,
        fill=(15, 23, 42, 230),
        outline=(51, 65, 85, 255),
        width=1
    )
    # Glowing cyan indicator dot
    draw.ellipse([web_pill_x + 14, web_pill_y + 13, web_pill_x + 24, web_pill_y + 23], fill=(56, 189, 248, 255))
    draw.text((web_pill_x + 32, web_pill_y + 8), "mymob.tech", font=font_pill, fill=(241, 245, 249, 255))

    # Instagram pill: @mymobpay
    ig_icon = generate_instagram_icon(22)
    ig_pill_x = web_pill_x + web_pill_w + 14
    ig_pill_y = 546
    ig_text = "Instagram: @mymobpay"
    tb_ig = draw.textbbox((0, 0), ig_text, font=font_pill)
    ig_pill_w = 10 + 22 + 8 + (tb_ig[2] - tb_ig[0]) + 14
    ig_pill_h = 36
    
    # Premium glassmorphic background with Instagram accent border
    draw.rounded_rectangle(
        [ig_pill_x, ig_pill_y, ig_pill_x + ig_pill_w, ig_pill_y + ig_pill_h],
        radius=10,
        fill=(28, 16, 38, 240),
        outline=(225, 48, 108, 180),
        width=1
    )
    bg.paste(ig_icon, (ig_pill_x + 10, ig_pill_y + 7), ig_icon)
    draw.text((ig_pill_x + 40, ig_pill_y + 8), ig_text, font=font_pill, fill=(255, 255, 255, 255))

    # Additional credibility tag
    sub_tag_x = ig_pill_x + ig_pill_w + 16
    draw.text((sub_tag_x, 555), "• 0% Middleman Fees", font=font_url, fill=(148, 163, 184, 255))

    # -------------------------------------------------------------
    # 10. RIGHT SIDE: Floating Glassmorphic Mobile Checkout Card
    # -------------------------------------------------------------
    card_w = 380
    card_h = 500
    card_x = 745
    card_y = 65

    # Glass Card Background Shadow
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d_sh = ImageDraw.Draw(shadow)
    d_sh.rounded_rectangle([card_x - 14, card_y - 8, card_x + card_w + 14, card_y + card_h + 18], radius=32, fill=(0, 0, 0, 190))
    shadow = shadow.filter(ImageFilter.GaussianBlur(34))
    bg.alpha_composite(shadow)

    card = Image.new('RGBA', (card_w, card_h), (0, 0, 0, 0))
    d_c = ImageDraw.Draw(card)
    d_c.rounded_rectangle([0, 0, card_w, card_h], radius=24, fill=(15, 23, 42, 245), outline=(255, 255, 255, 55), width=1)
    d_c.line([(24, 1), (card_w - 24, 1)], fill=(255, 255, 255, 110), width=1)

    # Card Top Bar
    d_c.text((25, 22), "Merchant Checkout", font=ImageFont.truetype(font_reg_path, 13), fill=(148, 163, 184, 255))
    
    # 0% FEE badge: high contrast emerald with white text
    fee_box_w = 86
    d_c.rounded_rectangle([card_w - fee_box_w - 25, 18, card_w - 25, 44], radius=13, fill=(6, 78, 59, 240), outline=(52, 211, 153, 255), width=1)
    d_c.ellipse([card_w - fee_box_w - 15, 26, card_w - fee_box_w - 7, 34], fill=(52, 211, 153, 255))
    d_c.text((card_w - fee_box_w, 24), "0% FEE", font=font_badge, fill=(255, 255, 255, 255))

    # Amount display
    d_c.text((25, 50), "₹ 2,499.00", font=ImageFont.truetype(font_bold_path, 34), fill=(255, 255, 255, 255))
    d_c.text((25, 94), "Order #MB-94021 • Direct Bank P2P", font=ImageFont.truetype(font_reg_path, 12), fill=(148, 163, 184, 255))

    # White QR Box Container
    qr_box_size = 230
    qr_x = (card_w - qr_box_size) // 2
    qr_y = 126
    d_c.rounded_rectangle([qr_x, qr_y, qr_x + qr_box_size, qr_y + qr_box_size], radius=18, fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=2)

    # Paste HD real QR code
    hd_qr = Image.open('scratch/hd_qr.png').convert('RGBA')
    qr_inner = hd_qr.resize((190, 190), Image.Resampling.LANCZOS)
    card.paste(qr_inner, (qr_x + 20, qr_y + 20), qr_inner)

    # Paste small MyMobPay ribbon logo mark in center of QR
    center_icon = mark_crop.resize((38, int(38 * (mark_crop.size[1] / mark_crop.size[0]))), Image.Resampling.LANCZOS)
    icon_bg = Image.new('RGBA', (48, 34), (255, 255, 255, 255))
    d_c_icon = ImageDraw.Draw(icon_bg)
    d_c_icon.rounded_rectangle([0, 0, 47, 33], radius=6, fill=(255, 255, 255, 255), outline=(203, 213, 225, 255), width=1)
    icon_bg.paste(center_icon, (5, 5), center_icon)
    card.paste(icon_bg, (qr_x + (qr_box_size - 48) // 2, qr_y + (qr_box_size - 34) // 2), icon_bg)

    # Card Bottom Status
    d_c.text((card_w // 2, qr_y + qr_box_size + 16), "Scan with any UPI App to Pay", font=ImageFont.truetype(font_bold_path, 13), fill=(241, 245, 249, 255), anchor="mt")
    d_c.text((card_w // 2, qr_y + qr_box_size + 36), "Direct instant credit to merchant bank", font=ImageFont.truetype(font_reg_path, 11), fill=(148, 163, 184, 255), anchor="mt")

    # Bottom security tag
    d_c.rounded_rectangle([25, card_h - 48, card_w - 25, card_h - 18], radius=8, fill=(255, 255, 255, 12))
    d_c.text((card_w // 2, card_h - 38), "256-bit Bank Grade Encrypted Webhook", font=ImageFont.truetype(font_reg_path, 11), fill=(148, 163, 184, 255), anchor="mt")

    # Composite Card onto BG
    bg.paste(card, (card_x, card_y), card)

    # 11. Save the final banner
    out_og = 'public/og-banner.png'
    art_dir = r"C:\Users\chauh\.gemini\antigravity-ide\brain\91cbf931-7fc1-4e94-9ebb-0883ffe63265"
    art_path = os.path.join(art_dir, 'new_og_banner.png')

    bg.convert('RGB').save(out_og, 'PNG', optimize=True)
    bg.convert('RGB').save(art_path, 'PNG', optimize=True)
    print(f"Generated flawless modern OG banner at {out_og} (1200x630)")

if __name__ == '__main__':
    create_flawless_og_banner()
