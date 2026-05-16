#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_diagrams_v2.py
4 диаграммы для темы PharmaChain Trace в стиле академического примера.

Принципы:
  * Use Case: акторы СНАРУЖИ system boundary; use case = ellipse внутри;
    линии связи "actor — use case" не пересекают другие use case'ы.
  * Концептуальная ER (Chen): entity = rectangle, relationship = diamond,
    attribute = ellipse; underline = PK; cardinality (1, N, M) на линиях
    между entity и diamond.
  * Логическая ER: PK/FK badges, crow's foot notation на КАЖДОМ конце
    связи (одинарная — ||, опциональная — |o, многозначная — >|, >o).
  * Физическая ER: snake_case + SQL types (BIGSERIAL, VARCHAR(N) и т.д.),
    та же crow's foot нотация.

Все PNG сохраняются в ./diagrams/. В Диплом.docx НЕ встраиваются.
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, Ellipse, Polygon
from matplotlib.lines import Line2D
import os

os.makedirs('diagrams', exist_ok=True)

BLACK = '#111111'
LW = 1.3
FONT = 'DejaVu Sans'

# ─────────────────────────────────────────────────────────────────────────────
# helpers
# ─────────────────────────────────────────────────────────────────────────────
def mkfig(w, h):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(0, w); ax.set_ylim(0, h)
    ax.set_aspect('equal'); ax.axis('off')
    fig.patch.set_facecolor('white')
    return fig, ax

def T(ax, x, y, s, sz=10, weight='normal', style='normal', ha='center', va='center'):
    ax.text(x, y, s, fontsize=sz, color=BLACK, fontweight=weight, fontstyle=style,
            ha=ha, va=va, family=FONT)

def L(ax, x1, y1, x2, y2, lw=LW):
    ax.add_line(Line2D([x1, x2], [y1, y2], color=BLACK, linewidth=lw,
                       solid_capstyle='round'))

def RECT(ax, x, y, w, h, lw=LW):
    ax.add_patch(Rectangle((x, y), w, h, fill=False, edgecolor=BLACK, linewidth=lw))

def ELL(ax, cx, cy, w, h, lw=LW):
    ax.add_patch(Ellipse((cx, cy), w, h, fill=False, edgecolor=BLACK, linewidth=lw))

def DIAM(ax, cx, cy, w, h, lw=LW):
    pts = [(cx-w/2, cy), (cx, cy+h/2), (cx+w/2, cy), (cx, cy-h/2)]
    ax.add_patch(Polygon(pts, closed=True, fill=False, edgecolor=BLACK, linewidth=lw))


# ─────────────────────────────────────────────────────────────────────────────
# crow's foot markers (notation: end of line at point (x,y), outward dir (nx,ny))
# ─────────────────────────────────────────────────────────────────────────────
def m_one(ax, x, y, nx, ny):
    """|| — exactly one (mandatory one)."""
    px, py = -ny, nx
    for d in (0.22, 0.40):
        L(ax, x + nx*d + px*0.16, y + ny*d + py*0.16,
              x + nx*d - px*0.16, y + ny*d - py*0.16, lw=1.3)

def m_zero_one(ax, x, y, nx, ny):
    """|o — zero or one (optional one)."""
    px, py = -ny, nx
    L(ax, x + nx*0.22 + px*0.16, y + ny*0.22 + py*0.16,
          x + nx*0.22 - px*0.16, y + ny*0.22 - py*0.16, lw=1.3)
    ax.add_patch(Ellipse((x + nx*0.50, y + ny*0.50), 0.18, 0.18,
                         fill=False, edgecolor=BLACK, linewidth=1.2))

def m_many(ax, x, y, nx, ny):
    """>| — one or many (mandatory many, crow's foot + tick)."""
    px, py = -ny, nx
    # tick
    L(ax, x + nx*0.50 + px*0.16, y + ny*0.50 + py*0.16,
          x + nx*0.50 - px*0.16, y + ny*0.50 - py*0.16, lw=1.3)
    # crow's foot: three lines from (x+nx*0.50,y+ny*0.50) back-and-out
    base_x, base_y = x + nx*0.50, y + ny*0.50
    for s in (-0.22, 0.0, 0.22):
        L(ax, base_x, base_y, x + px*s, y + py*s, lw=1.2)

def m_zero_many(ax, x, y, nx, ny):
    """>o — zero or many (optional many)."""
    px, py = -ny, nx
    ax.add_patch(Ellipse((x + nx*0.55, y + ny*0.55), 0.18, 0.18,
                         fill=False, edgecolor=BLACK, linewidth=1.2))
    base_x, base_y = x + nx*0.45, y + ny*0.45
    for s in (-0.22, 0.0, 0.22):
        L(ax, base_x, base_y, x + px*s, y + py*s, lw=1.2)

MARK = {'one': m_one, 'zero_one': m_zero_one,
        'many': m_many, 'zero_many': m_zero_many}


# ─────────────────────────────────────────────────────────────────────────────
# 1) USE CASE DIAGRAM
# ─────────────────────────────────────────────────────────────────────────────
def actor(ax, cx, cy_feet, label, italic=False):
    """Stick figure. cy_feet = y of feet (bottom). Label drawn below feet."""
    head_r = 0.20
    body_top = cy_feet + 1.45
    head_cy  = body_top + head_r
    # head
    ax.add_patch(Ellipse((cx, head_cy), head_r*2, head_r*2,
                         fill=False, edgecolor=BLACK, linewidth=LW))
    # body
    L(ax, cx, body_top, cx, cy_feet + 0.45)
    # arms
    L(ax, cx - 0.40, body_top - 0.30, cx + 0.40, body_top - 0.30)
    # legs
    L(ax, cx, cy_feet + 0.45, cx - 0.30, cy_feet)
    L(ax, cx, cy_feet + 0.45, cx + 0.30, cy_feet)
    # label
    T(ax, cx, cy_feet - 0.32, label, sz=9.5,
      style='italic' if italic else 'normal')

def diag_usecase():
    """Layout: 4 actors on left, system boundary on right.
       Use cases are grouped horizontally in rows aligned with each actor."""
    W, H = 13.5, 13
    fig, ax = mkfig(W, H)

    # System boundary
    sb_x, sb_y, sb_w, sb_h = 3.6, 0.6, 9.4, 11.8
    RECT(ax, sb_x, sb_y, sb_w, sb_h, lw=1.5)
    # Title chip
    chip_w = 3.0
    ax.add_patch(FancyBboxPatch(
        (sb_x + sb_w/2 - chip_w/2, sb_y + sb_h - 0.20),
        chip_w, 0.55,
        boxstyle="round,pad=0.02,rounding_size=0.18",
        fill=True, facecolor='white', edgecolor=BLACK, linewidth=LW))
    T(ax, sb_x + sb_w/2, sb_y + sb_h + 0.07, 'PharmaChain Trace',
      sz=10.5, weight='bold')

    # Use case ellipses
    UC_W, UC_H = 2.2, 0.85

    # Layout: 4 horizontal "rows" — one per actor.
    # Each row has 3 columns of use cases at x=5.2, 7.7, 10.2, 12.3
    # but to fit nicely, we'll vary number of UCs per actor.

    # ── Actor 1: Авторизованный участник цепочки (Manufacturer/Distributor/Pharmacy)
    a1_y = 11.0
    uc1 = [
        (5.2,  11.45, 'Создание\nпартии'),
        (7.55, 11.45, 'Создание\nпродукта'),
        (9.85, 11.45, 'Передача\nпродукта'),
        (5.2,  10.20, 'Обновление\nстатуса'),
        (7.55, 10.20, 'Продажа\n(Sold)'),
        (9.85, 10.20, 'Просмотр\nистории'),
    ]
    # ── Actor 2: Регулятор
    a2_y = 7.7
    uc2 = [
        (5.2,  8.10, 'Отзыв\nпартии'),
        (7.55, 8.10, 'Восстановление\nпартии'),
        (9.85, 8.10, 'Просмотр\nстатистики'),
        (7.55, 6.85, 'Просмотр\naudit log'),
    ]
    # ── Actor 3: Администратор
    a3_y = 5.0
    uc3 = [
        (5.2,  5.40, 'Назначение\nролей'),
        (7.55, 5.40, 'Блокировка\nпользователя'),
        (9.85, 5.40, 'Сброс пароля\nпользователя'),
    ]
    # ── Actor 4: Потребитель (Consumer, unauthenticated)
    a4_y = 2.2
    uc4 = [
        (5.2,  2.60, 'Верификация\nпо QR-коду'),
        (7.55, 2.60, 'Верификация\nпо серийному №'),
        (9.85, 2.60, 'Просмотр\nистории продукта'),
        (5.2,  1.35, 'Регистрация'),
        (7.55, 1.35, 'Авторизация'),
    ]

    for ucs in (uc1, uc2, uc3, uc4):
        for x, y, lbl in ucs:
            ELL(ax, x, y, UC_W, UC_H)
            T(ax, x, y, lbl, sz=8.5)

    # Place actors at proper y-levels (feet ~= bottom of the row)
    actor(ax, 1.8, a1_y - 0.4, 'Авторизованный\nучастник цепочки')
    actor(ax, 1.8, a2_y - 0.4, 'Регулятор')
    actor(ax, 1.8, a3_y - 0.4, 'Администратор')
    actor(ax, 1.8, a4_y - 0.4, 'Потребитель', italic=True)

    # Connection lines via per-actor vertical bus to eliminate crossings.
    # Actor right shoulder → small horizontal stub → bus (vertical) at bus_x
    # → horizontal branch from bus to each use case left edge.
    def connect(actor_cx, actor_feet_y, ucs, bus_x):
        ax_x = actor_cx + 0.10
        ax_y = actor_feet_y + 1.15
        if not ucs:
            return
        # main stub from shoulder to bus at shoulder height
        L(ax, ax_x, ax_y, bus_x, ax_y, lw=0.9)
        ys = [uy for _, uy, _ in ucs]
        y_top, y_bot = max(ys + [ax_y]), min(ys + [ax_y])
        # vertical bus
        L(ax, bus_x, y_bot, bus_x, y_top, lw=0.9)
        # branch to each use case
        for ux, uy, _ in ucs:
            L(ax, bus_x, uy, ux - UC_W/2, uy, lw=0.9)

    # each actor uses a distinct bus_x so buses don't merge across rows
    connect(1.8, a1_y - 0.4, uc1, bus_x=3.30)
    connect(1.8, a2_y - 0.4, uc2, bus_x=3.30)
    connect(1.8, a3_y - 0.4, uc3, bus_x=3.30)
    connect(1.8, a4_y - 0.4, uc4, bus_x=3.30)

    plt.tight_layout()
    plt.savefig('diagrams/v2_fig_2_1_usecase.png', dpi=200,
                bbox_inches='tight', facecolor='white')
    plt.close()
    print('  saved diagrams/v2_fig_2_1_usecase.png')


# ─────────────────────────────────────────────────────────────────────────────
# 2) CONCEPTUAL ER (Chen notation)
# ─────────────────────────────────────────────────────────────────────────────
def diag_conceptual_er():
    """Chen-notation ER. Generous canvas + non-overlapping sectors for each
       entity's attributes. Relationship diamonds placed exactly on the
       entity-to-entity midpoints. Cardinalities (1, N) printed on each
       half-segment near the corresponding entity."""
    W, H = 20, 12
    fig, ax = mkfig(W, H)

    EW, EH = 2.10, 0.85
    RW, RH = 1.70, 0.70
    AW, AH = 1.45, 0.55

    # ── Entities: spread out grid with big clearances ────────────────────
    # Top row attributes go above; bottom row attributes go below.
    # Three core middle-row entities; three "child" entities below; one above.
    E = {
        'user':    (5.0,  6.5,  'Пользователи'),
        'batch':   (10.0, 6.5,  'Партии'),
        'product': (15.0, 6.5,  'Продукты'),
        'meta':    (10.0, 10.7, 'Метаданные\nпартии'),
        'audit':   (2.5,  2.0,  'Audit log'),
        'event':   (9.0,  2.0,  'События\nблокчейна'),
        'history': (16.5, 2.0,  'История\nдвижения'),
    }
    for cx, cy, lbl in E.values():
        RECT(ax, cx - EW/2, cy - EH/2, EW, EH, lw=1.4)
        T(ax, cx, cy, lbl, sz=9.5, weight='bold')

    # ── Relationships: diamonds on entity-to-entity midpoints ────────────
    # (cx, cy, label, ent_a, card_a, ent_b, card_b)
    R = [
        (7.5,  6.5,  'создаёт',   'user',    '1', 'batch',   'N'),
        (12.5, 6.5,  'содержит',  'batch',   '1', 'product', 'N'),
        (10.0, 8.6,  'описана',   'batch',   '1', 'meta',    '1'),
        (3.75, 4.25, 'пишет',     'user',    '1', 'audit',   'N'),
        (12.0, 4.25, 'эмитирует', 'product', '1', 'event',   'N'),
        (15.75, 4.25,'имеет',     'product', '1', 'history', 'N'),
    ]
    for cx, cy, lbl, ea, ca, eb, cb in R:
        DIAM(ax, cx, cy, RW, RH, lw=1.3)
        T(ax, cx, cy, lbl, sz=8)
        ax_, ay_, _ = E[ea]
        bx_, by_, _ = E[eb]
        L(ax, ax_, ay_, cx, cy, lw=1.0)
        L(ax, bx_, by_, cx, cy, lw=1.0)
        # cardinality at 30% from each entity
        def card_label(ex, ey, dx_, dy_, txt):
            t = 0.32
            tx = ex + (dx_ - ex) * t
            ty = ey + (dy_ - ey) * t
            T(ax, tx + 0.22, ty + 0.22, txt, sz=8.5, weight='bold')
        card_label(ax_, ay_, cx, cy, ca)
        card_label(bx_, by_, cx, cy, cb)

    # ── Attributes — placed only in non-conflict sectors ─────────────────
    # (label, dx, dy, is_pk)  — dx/dy from entity centre
    A = {
        # User (5.0, 6.5): attrs ABOVE; "роль" sits at the left side
        'user': [
            ('wallet',    -1.55, 1.80, True),
            ('имя',       -0.10, 2.40, False),
            ('email',      1.35, 1.80, False),
            ('роль',      -2.10, 0.40, False),
        ],
        # Batch (10.0, 6.5): ALL four attrs placed ABOVE the relationship line,
        # in two columns (x≈7.6 and x≈12.4) skirting the Batch–Meta line at x=10.
        'batch': [
            ('batchId',       -2.40, 1.85, True),
            ('дата произв.',  -2.40, 3.05, False),
            ('recalled',       2.40, 1.85, False),
            ('срок годности',  2.40, 3.05, False),
        ],
        # Product (15.0, 6.5): attrs ABOVE in NE sector; "статус" on the right
        'product': [
            ('productId',   -1.35, 1.80, True),
            ('серийный №',   0.10, 2.40, False),
            ('название',     1.55, 1.80, False),
            ('статус',       2.10, 0.40, False),
        ],
        # Meta (10.0, 10.7): attrs ABOVE (top of figure)
        'meta': [
            ('описание',    -1.85, 0.95, False),
            ('номер партии', 1.85, 0.95, False),
        ],
        # Audit (2.5, 2.0): attrs BELOW + LEFT
        'audit': [
            ('action',    -1.65, -0.95, False),
            ('timestamp',  0.00, -1.45, False),
            ('tx_hash',    1.65, -0.95, False),
        ],
        # Event (9.0, 2.0): attrs BELOW
        'event': [
            ('event_type',  -1.65, -0.95, False),
            ('tx_hash',      0.00, -1.45, False),
            ('block_number', 1.65, -0.95, False),
        ],
        # History (16.5, 2.0): attrs BELOW + RIGHT
        'history': [
            ('timestamp', -1.65, -0.95, False),
            ('действие',   0.00, -1.45, False),
            ('opId',       1.65, -0.95, False),
        ],
    }
    from math import hypot
    for ent, attrs in A.items():
        ecx, ecy, _ = E[ent]
        for lbl, dx, dy, is_pk in attrs:
            cx, cy = ecx + dx, ecy + dy
            ELL(ax, cx, cy, AW, AH, lw=1.0)
            T(ax, cx, cy, lbl, sz=8.0)
            if is_pk:
                ulen = max(0.50, len(lbl) * 0.085)
                L(ax, cx - ulen/2, cy - 0.18, cx + ulen/2, cy - 0.18, lw=0.7)
            # connect entity-boundary → attribute-boundary
            vx, vy = cx - ecx, cy - ecy
            if abs(vx) + abs(vy) < 1e-6:
                continue
            tx = (EW/2) / abs(vx) if vx else 1e9
            ty = (EH/2) / abs(vy) if vy else 1e9
            t_ent = min(tx, ty)
            sx, sy = ecx + vx*t_ent, ecy + vy*t_ent
            ex = (AW/2) / abs(vx) if vx else 1e9
            ey = (AH/2) / abs(vy) if vy else 1e9
            t_att = min(ex, ey)
            fx, fy = cx - vx*t_att, cy - vy*t_att
            L(ax, sx, sy, fx, fy, lw=0.7)

    plt.tight_layout()
    plt.savefig('diagrams/v2_fig_2_2_conceptual_er.png', dpi=200,
                bbox_inches='tight', facecolor='white')
    plt.close()
    print('  saved diagrams/v2_fig_2_2_conceptual_er.png')


# ─────────────────────────────────────────────────────────────────────────────
# Logical / Physical ER table drawing
# ─────────────────────────────────────────────────────────────────────────────
def er_table(ax, x, y, title, rows, w=3.0, row_h=0.36):
    """Draw a logical/physical-style table. Returns geometry dict.
    rows = [(badge, name)] where badge in {'PK','FK','PK, FK',''}."""
    hdr_h = 0.50
    total_h = hdr_h + row_h * len(rows)
    # header
    RECT(ax, x, y + total_h - hdr_h, w, hdr_h, lw=1.4)
    T(ax, x + w/2, y + total_h - hdr_h/2, title, sz=9.8, weight='bold')
    # body
    RECT(ax, x, y, w, total_h - hdr_h, lw=1.4)
    badge_w = 0.62
    for i, (badge, name) in enumerate(rows):
        ry = y + total_h - hdr_h - (i+1)*row_h
        # vertical separator after badge column
        L(ax, x + badge_w, ry, x + badge_w, ry + row_h, lw=0.7)
        if badge:
            T(ax, x + badge_w/2, ry + row_h/2, badge, sz=7.8, weight='bold')
        is_pk = ('PK' in badge)
        T(ax, x + badge_w + 0.10, ry + row_h/2, name, sz=8.3,
          ha='left', weight='bold' if is_pk else 'normal')
        if is_pk:
            # underline PK name
            ulen = max(0.50, len(name) * 0.085)
            L(ax, x + badge_w + 0.10, ry + row_h/2 - 0.14,
                  x + badge_w + 0.10 + ulen, ry + row_h/2 - 0.14, lw=0.7)
        # horizontal row separator
        if i < len(rows) - 1:
            L(ax, x, ry, x + w, ry, lw=0.5)
    def row_y(i):
        return y + total_h - hdr_h - row_h*(i + 0.5)
    return {'x': x, 'y': y, 'w': w, 'h': total_h,
            'l': x, 'r': x + w, 't': y + total_h, 'b': y,
            'row_y': row_y}


def fk_link(ax, t_from, idx_from, side_from,
                t_to,   idx_to,   side_to,
                card_from='many', card_to='one',
                bend_x=None, bend_y=None):
    """Draw FK link between two tables with crow's foot markers.
    side ∈ {'L','R','T','B'} — which side of table the line exits/enters.
    bend_x/bend_y override the elbow position for orthogonal routing."""
    def anchor(t, idx, side):
        if side == 'L':
            return t['l'], t['row_y'](idx), -1, 0
        if side == 'R':
            return t['r'], t['row_y'](idx),  1, 0
        if side == 'T':
            return t['l'] + t['w']/2, t['t'], 0,  1
        if side == 'B':
            return t['l'] + t['w']/2, t['b'], 0, -1
        raise ValueError(side)

    x1, y1, nx1, ny1 = anchor(t_from, idx_from, side_from)
    x2, y2, nx2, ny2 = anchor(t_to,   idx_to,   side_to)

    # Routing: if same orientation (both horizontal exits), use H-V-H.
    if (nx1 != 0 and nx2 != 0):
        # both horizontal exits
        if bend_x is None:
            bend_x = (x1 + x2) / 2
        L(ax, x1, y1, bend_x, y1, lw=1.0)
        L(ax, bend_x, y1, bend_x, y2, lw=1.0)
        L(ax, bend_x, y2, x2, y2, lw=1.0)
    elif (ny1 != 0 and ny2 != 0):
        # both vertical exits
        if bend_y is None:
            bend_y = (y1 + y2) / 2
        L(ax, x1, y1, x1, bend_y, lw=1.0)
        L(ax, x1, bend_y, x2, bend_y, lw=1.0)
        L(ax, x2, bend_y, x2, y2, lw=1.0)
    else:
        # mixed
        L(ax, x1, y1, x2, y1, lw=1.0)
        L(ax, x2, y1, x2, y2, lw=1.0)

    # Cardinality markers at each endpoint (drawn slightly inside the line)
    MARK[card_from](ax, x1, y1, nx1, ny1)
    MARK[card_to  ](ax, x2, y2, nx2, ny2)


# ─────────────────────────────────────────────────────────────────────────────
# 3) LOGICAL ER (Russian, PK/FK with crow's foot)
# ─────────────────────────────────────────────────────────────────────────────
def diag_logical_er():
    W, H = 17, 12
    fig, ax = mkfig(W, H)

    # Grid layout: 3 columns × 3 rows with clearance
    # Column x: left=0.6, mid=6.4, right=12.2
    # Row tops: top=11.5, mid=7.5, bot=3.6 (approx)
    users = er_table(ax, 0.6, 8.4, 'Пользователи', [
        ('PK', 'ID пользователя'),
        ('',   'Wallet адрес'),
        ('',   'Имя'),
        ('',   'Email'),
        ('',   'Роль'),
        ('',   'Дата регистрации'),
    ], w=3.4)

    batches = er_table(ax, 6.4, 8.0, 'Партии', [
        ('PK', 'ID партии'),
        ('FK', 'ID производителя'),
        ('',   'Дата производства'),
        ('',   'Срок годности'),
        ('',   'Хеш темп. лога'),
        ('',   'Хеш метаданных'),
        ('',   'Отозвана'),
    ], w=3.4)

    products = er_table(ax, 12.2, 7.5, 'Продукты', [
        ('PK', 'ID продукта'),
        ('FK', 'ID партии'),
        ('FK', 'ID владельца'),
        ('',   'Серийный номер'),
        ('',   'Название'),
        ('',   'Статус'),
        ('',   'Заблокирован'),
        ('',   'Дата создания'),
    ], w=3.6)

    history = er_table(ax, 12.2, 0.6, 'История движения', [
        ('PK', 'ID записи'),
        ('FK', 'ID продукта'),
        ('',   'Timestamp'),
        ('',   'Actor'),
        ('',   'Prev владелец'),
        ('',   'New владелец'),
        ('',   'Действие'),
        ('',   'Operation ID'),
    ], w=3.6)

    meta = er_table(ax, 6.4, 4.0, 'Метаданные партии', [
        ('PK', 'ID метаданных'),
        ('FK', 'ID партии'),
        ('',   'Описание'),
        ('',   'Номер партии'),
        ('',   'Производитель'),
    ], w=3.4)

    audit = er_table(ax, 0.6, 4.8, 'Audit log', [
        ('PK', 'ID записи'),
        ('FK', 'ID пользователя'),
        ('',   'Action'),
        ('',   'Resource'),
        ('',   'Timestamp'),
        ('',   'Tx hash'),
    ], w=3.4)

    events = er_table(ax, 0.6, 0.6, 'События блокчейна', [
        ('PK', 'ID события'),
        ('FK', 'ID продукта'),
        ('',   'Event type'),
        ('',   'Tx hash'),
        ('',   'Block number'),
        ('',   'Timestamp'),
    ], w=3.4)

    # FK links (parent end = 'one', child end = 'many')
    # Users(1) → Batches(N): batches.ID_производителя (row 1)
    fk_link(ax, users,   0, 'R', batches, 1, 'L',
            card_from='one', card_to='many', bend_x=5.2)
    # Batches(1) → Products(N): products.ID_партии (row 1)
    fk_link(ax, batches, 0, 'R', products, 1, 'L',
            card_from='one', card_to='many', bend_x=11.0)
    # Users(1) → Products(N): products.ID_владельца (row 2). Route ABOVE all tables.
    fk_link(ax, users,   0, 'T', products, 2, 'T',
            card_from='one', card_to='many', bend_y=11.9)
    # Batches(1) → Metadata(1): meta.ID_партии (row 1)
    fk_link(ax, batches, 0, 'B', meta,    1, 'T',
            card_from='one', card_to='one')
    # Users(1) → Audit(N): audit.ID_пользователя (row 1)
    fk_link(ax, users,   0, 'B', audit,   1, 'T',
            card_from='one', card_to='many')
    # Products(1) → History(N): history.ID_продукта (row 1)
    fk_link(ax, products, 0, 'B', history, 1, 'T',
            card_from='one', card_to='many')
    # Products(1) → Events(N): events.ID_продукта (row 1) — long route through bottom
    fk_link(ax, products, 0, 'L', events,  1, 'R',
            card_from='one', card_to='many', bend_x=5.4)

    plt.tight_layout()
    plt.savefig('diagrams/v2_fig_2_3_logical_er.png', dpi=200,
                bbox_inches='tight', facecolor='white')
    plt.close()
    print('  saved diagrams/v2_fig_2_3_logical_er.png')


# ─────────────────────────────────────────────────────────────────────────────
# 4) PHYSICAL ER (English snake_case + SQL types)
# ─────────────────────────────────────────────────────────────────────────────
def diag_physical_er():
    W, H = 17, 12
    fig, ax = mkfig(W, H)

    users = er_table(ax, 0.6, 8.4, 'app_users', [
        ('PK', 'id : BIGSERIAL'),
        ('',   'wallet_address : VARCHAR(42)'),
        ('',   'username : VARCHAR(150)'),
        ('',   'email : VARCHAR(255)'),
        ('',   'role : VARCHAR(20)'),
        ('',   'created_at : TIMESTAMP'),
    ], w=4.0)

    batches = er_table(ax, 7.0, 8.0, 'product_batches', [
        ('PK', 'id : BIGSERIAL'),
        ('FK', 'manufacturer_id : BIGINT'),
        ('',   'blockchain_batch_id : BIGINT'),
        ('',   'production_date : TIMESTAMP'),
        ('',   'expiration_date : TIMESTAMP'),
        ('',   'temperature_hash : BYTEA'),
        ('',   'metadata_hash : BYTEA'),
        ('',   'recalled : BOOLEAN'),
    ], w=4.0)

    products = er_table(ax, 13.0, 7.5, 'products', [
        ('PK', 'id : BIGSERIAL'),
        ('FK', 'batch_id : BIGINT'),
        ('FK', 'current_owner_id : BIGINT'),
        ('',   'blockchain_product_id : BIGINT'),
        ('',   'serial_number : VARCHAR(64)'),
        ('',   'name : VARCHAR(200)'),
        ('',   'status : SMALLINT'),
        ('',   'blocked : BOOLEAN'),
        ('',   'created_at : TIMESTAMP'),
    ], w=4.0)

    history = er_table(ax, 13.0, 0.6, 'product_histories', [
        ('PK', 'id : BIGSERIAL'),
        ('FK', 'product_id : BIGINT'),
        ('',   'timestamp : TIMESTAMP'),
        ('',   'actor : VARCHAR(42)'),
        ('',   'prev_owner : VARCHAR(42)'),
        ('',   'new_owner : VARCHAR(42)'),
        ('',   'action : VARCHAR(40)'),
        ('',   'operation_id : BYTEA'),
    ], w=4.0)

    meta = er_table(ax, 7.0, 4.0, 'product_batch_metadata', [
        ('PK', 'id : BIGSERIAL'),
        ('FK', 'batch_id : BIGINT'),
        ('',   'description : TEXT'),
        ('',   'batch_number : VARCHAR(100)'),
        ('',   'manufacturer_name : VARCHAR(200)'),
    ], w=4.0)

    audit = er_table(ax, 0.6, 4.8, 'audit_logs', [
        ('PK', 'id : BIGSERIAL'),
        ('FK', 'user_id : BIGINT'),
        ('',   'action : VARCHAR(80)'),
        ('',   'resource : VARCHAR(120)'),
        ('',   'timestamp : TIMESTAMP'),
        ('',   'tx_hash : VARCHAR(66)'),
    ], w=4.0)

    events = er_table(ax, 0.6, 0.6, 'product_events', [
        ('PK', 'id : BIGSERIAL'),
        ('FK', 'blockchain_product_id : BIGINT'),
        ('',   'event_type : VARCHAR(40)'),
        ('',   'tx_hash : VARCHAR(66)'),
        ('',   'block_number : BIGINT'),
        ('',   'timestamp : TIMESTAMP'),
    ], w=4.0)

    fk_link(ax, users,   0, 'R', batches, 1, 'L',
            card_from='one', card_to='many', bend_x=5.6)
    fk_link(ax, batches, 0, 'R', products, 1, 'L',
            card_from='one', card_to='many', bend_x=11.7)
    fk_link(ax, users,   0, 'T', products, 2, 'T',
            card_from='one', card_to='many', bend_y=11.9)
    fk_link(ax, batches, 0, 'B', meta,    1, 'T',
            card_from='one', card_to='one')
    fk_link(ax, users,   0, 'B', audit,   1, 'T',
            card_from='one', card_to='many')
    fk_link(ax, products, 0, 'B', history, 1, 'T',
            card_from='one', card_to='many')
    fk_link(ax, products, 0, 'L', events,  1, 'R',
            card_from='one', card_to='many', bend_x=5.85)

    plt.tight_layout()
    plt.savefig('diagrams/v2_fig_2_4_physical_er.png', dpi=200,
                bbox_inches='tight', facecolor='white')
    plt.close()
    print('  saved diagrams/v2_fig_2_4_physical_er.png')


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print('Generating v2 diagrams (academic style) -> ./diagrams/')
    diag_usecase()
    diag_conceptual_er()
    diag_logical_er()
    diag_physical_er()
    print('Done. NOT embedded into Диплом.docx.')
