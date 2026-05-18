#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_docx.py — Диплом: Blockchain Pharma Tracking System / PharmaChain Trace
Специальность 09.02.07 Информационные системы и программирование
"""

from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

FONT = 'Times New Roman'
FONT_CODE = 'Consolas'
SZ = Pt(14)
SZ_CODE = Pt(10)
SZ_TBL = Pt(12)
IND = Cm(1.25)
LS = 1.5
EN = '–'   # en-dash для подписей и маркеров


def rf(run, name=FONT, size=SZ, bold=False, italic=False):
    run.bold = bold
    run.italic = italic
    run.font.name = name
    run.font.size = size
    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.insert(0, rFonts)
    for attr in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
        rFonts.set(qn(attr), name)
    return run


def fp(para, align=WD_ALIGN_PARAGRAPH.JUSTIFY, fi=IND,
       sb=Pt(0), sa=Pt(0), ls=LS, kwn=False):
    pf = para.paragraph_format
    pf.alignment = align
    pf.first_line_indent = fi
    pf.space_before = sb
    pf.space_after = sa
    pf.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    pf.line_spacing = ls
    if kwn:
        pf.keep_with_next = True
    return para


def pp(doc, text, bold=False, italic=False,
       align=WD_ALIGN_PARAGRAPH.JUSTIFY, fi=IND, sb=Pt(0), sa=Pt(0)):
    para = doc.add_paragraph()
    fp(para, align=align, fi=fi, sb=sb, sa=sa)
    rf(para.add_run(text), bold=bold, italic=italic)
    return para


def _outline(para, lvl, page_break=False):
    pPr = para._p.get_or_add_pPr()
    ol = OxmlElement('w:outlineLvl')
    ol.set(qn('w:val'), str(lvl))
    pPr.append(ol)
    if page_break:
        pb = OxmlElement('w:pageBreakBefore')
        pPr.append(pb)


def hS(doc, text):
    para = doc.add_paragraph()
    fp(para, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sa=Pt(18), kwn=True)
    _outline(para, 0, page_break=True)
    rf(para.add_run(text.upper()), bold=True)
    return para


def hR(doc, num, text):
    para = doc.add_paragraph()
    fp(para, align=WD_ALIGN_PARAGRAPH.LEFT, fi=IND, sa=Pt(12), kwn=True)
    _outline(para, 1, page_break=True)
    rf(para.add_run(f'{num} {text.upper()}'), bold=True)
    return para


def hP(doc, num, text, sb=Pt(24)):
    para = doc.add_paragraph()
    fp(para, align=WD_ALIGN_PARAGRAPH.LEFT, fi=IND, sb=sb, sa=Pt(12), kwn=True)
    _outline(para, 2)
    rf(para.add_run(f'{num} {text}'), bold=True)
    return para


def hPP(doc, num, text, sb=Pt(24)):
    para = doc.add_paragraph()
    fp(para, align=WD_ALIGN_PARAGRAPH.LEFT, fi=IND, sb=sb, sa=Pt(12), kwn=True)
    _outline(para, 3)
    rf(para.add_run(f'{num} {text}'), bold=True)
    return para


def hPPP(doc, num, text, sb=Pt(18)):
    para = doc.add_paragraph()
    fp(para, align=WD_ALIGN_PARAGRAPH.LEFT, fi=IND, sb=sb, sa=Pt(6), kwn=True)
    _outline(para, 4)
    rf(para.add_run(f'{num} {text}'), bold=True)
    return para


def _list_ind(para):
    pPr = para._p.get_or_add_pPr()
    ind = pPr.find(qn('w:ind'))
    if ind is None:
        ind = OxmlElement('w:ind')
        pPr.append(ind)
    ind.set(qn('w:left'), '0')
    ind.set(qn('w:firstLine'), '709')


def li(doc, text, last=False):
    para = doc.add_paragraph()
    pf = para.paragraph_format
    pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf.space_before = Pt(0)
    pf.space_after = Pt(0)
    pf.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    pf.line_spacing = LS
    _list_ind(para)
    rf(para.add_run(f'{EN} {text}{"." if last else ";"}'))
    return para


def li_n(doc, n, text, last=False):
    para = doc.add_paragraph()
    pf = para.paragraph_format
    pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf.space_before = Pt(0)
    pf.space_after = Pt(0)
    pf.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    pf.line_spacing = LS
    _list_ind(para)
    rf(para.add_run(f'{n}) {text}{"." if last else ";"}'))
    return para


def fig(doc, num, title):
    stub = doc.add_paragraph()
    fp(stub, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0))
    r = stub.add_run(f'[МЕСТО ДЛЯ РИСУНКА {num}]')
    r.font.name = FONT
    r.font.size = SZ
    r.font.color.rgb = RGBColor(0xAA, 0xAA, 0xAA)
    cap = doc.add_paragraph()
    fp(cap, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sa=Pt(6))
    cap.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    rf(cap.add_run(f'Рисунок {num} {EN} {title}'))
    return cap


def lhdr(doc, num, title):
    para = doc.add_paragraph()
    pf = para.paragraph_format
    pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf.first_line_indent = Cm(0)
    pf.space_before = Pt(6)
    pf.space_after = Pt(6)
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    rf(para.add_run(f'Листинг {num} {EN} {title}'), italic=True)
    return para


def lcode(doc, code):
    para = doc.add_paragraph()
    pf = para.paragraph_format
    pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf.first_line_indent = Cm(0)
    pf.left_indent = Cm(0)
    pf.space_before = Pt(0)
    pf.space_after = Pt(0)
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    r = para.add_run(code)
    r.font.name = FONT_CODE
    r.font.size = SZ_CODE
    return para


def lblock(doc, code_text):
    """Вставить многострочный листинг."""
    for line in code_text.split('\n'):
        lcode(doc, line)
    # отступ после листинга
    pp(doc, '', sb=Pt(6), sa=Pt(0))


def thdr(doc, num, title):
    para = doc.add_paragraph()
    pf = para.paragraph_format
    pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf.first_line_indent = Cm(0)
    pf.space_before = Pt(12)
    pf.space_after = Pt(12)
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    rf(para.add_run(f'Таблица {num} {EN} {title}'))
    return para


def tcell(cell, text, bold=False, center=False, sz=None):
    cell.text = ''
    para = cell.paragraphs[0]
    pf = para.paragraph_format
    pf.space_before = Pt(2)
    pf.space_after = Pt(2)
    pf.first_line_indent = Cm(0)
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    pf.alignment = WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.LEFT
    rf(para.add_run(text), bold=bold, size=sz or SZ_TBL)


def mktable(doc, hdrs, rows, after_sb=Pt(24)):
    n = len(hdrs)
    tbl = doc.add_table(rows=1 + len(rows), cols=n)
    tbl.style = 'Table Grid'
    for i, h in enumerate(hdrs):
        tcell(tbl.cell(0, i), h, bold=True, center=True)
    for r, row in enumerate(rows):
        for c, val in enumerate(row):
            tcell(tbl.cell(r + 1, c), str(val))
    # отступ после таблицы
    p = doc.add_paragraph()
    fp(p, fi=IND, sb=after_sb)
    rf(p.add_run(''))
    return tbl


def mk_tc_table(doc, tc_num, title, precond, steps, postcond=''):
    """Individual test-case table matching example format (6 cols, merged header cells)."""
    total_rows = 4 + len(steps) + 1   # ID + title + precond + step_hdr + steps + postcond
    tbl = doc.add_table(rows=total_rows, cols=6)
    tbl.style = 'Table Grid'

    def merge15(r):
        tbl.cell(r, 1).merge(tbl.cell(r, 5))

    # Row 0: Тест кейс ID
    merge15(0)
    tcell(tbl.cell(0, 0), 'Тест кейс ID', bold=True)
    tcell(tbl.cell(0, 1), str(tc_num), center=True, bold=True)

    # Row 1: Заголовок
    merge15(1)
    tcell(tbl.cell(1, 0), 'Заголовок', bold=True)
    tcell(tbl.cell(1, 1), title)

    # Row 2: Предусловие
    merge15(2)
    tcell(tbl.cell(2, 0), 'Предусловие', bold=True)
    tcell(tbl.cell(2, 1), precond)

    # Row 3: Step column headers
    tcell(tbl.cell(3, 0), '')
    tcell(tbl.cell(3, 1), '№ шага',              bold=True, center=True)
    tcell(tbl.cell(3, 2), 'Шаг',                 bold=True, center=True)
    tcell(tbl.cell(3, 3), 'Ожидаемый результат', bold=True, center=True)
    tcell(tbl.cell(3, 4), 'Статус',              bold=True, center=True)
    tcell(tbl.cell(3, 5), 'Коммент.',            bold=True, center=True)

    # Step rows
    for i, (sn, st, er, status, cmt) in enumerate(steps):
        r = 4 + i
        tcell(tbl.cell(r, 0), '')
        tcell(tbl.cell(r, 1), str(sn), center=True)
        tcell(tbl.cell(r, 2), st)
        tcell(tbl.cell(r, 3), er)
        tcell(tbl.cell(r, 4), status, center=True)
        tcell(tbl.cell(r, 5), cmt)

    # Postcondition row
    last = total_rows - 1
    merge15(last)
    tcell(tbl.cell(last, 0), 'Постусловие', bold=True)
    tcell(tbl.cell(last, 1), postcond)

    # Space after table
    p = doc.add_paragraph()
    fp(p, fi=IND, sb=Pt(12))
    rf(p.add_run(''))


def setup_footer(doc):
    for section in doc.sections:
        footer = section.footer
        footer.is_linked_to_previous = False
        para = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
        para.clear()
        fp(para, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0))
        run = para.add_run()
        rf(run)
        for tag in ['begin', 'separate']:
            fc = OxmlElement('w:fldChar')
            fc.set(qn('w:fldCharType'), tag)
            run._r.append(fc)
        instr = OxmlElement('w:instrText')
        instr.set(qn('xml:space'), 'preserve')
        instr.text = ' PAGE '
        run._r.append(instr)
        fc_end = OxmlElement('w:fldChar')
        fc_end.set(qn('w:fldCharType'), 'end')
        run._r.append(fc_end)


def add_toc(doc):
    para = doc.add_paragraph()
    fp(para, align=WD_ALIGN_PARAGRAPH.LEFT, fi=Cm(0))
    run = para.add_run()
    fc1 = OxmlElement('w:fldChar')
    fc1.set(qn('w:fldCharType'), 'begin')
    fc1.set(qn('w:dirty'), '1')
    run._r.append(fc1)
    instr = OxmlElement('w:instrText')
    instr.set(qn('xml:space'), 'preserve')
    instr.text = ' TOC \\o "1-4" \\h \\z \\u '
    run._r.append(instr)
    fc2 = OxmlElement('w:fldChar')
    fc2.set(qn('w:fldCharType'), 'separate')
    run._r.append(fc2)
    fc3 = OxmlElement('w:fldChar')
    fc3.set(qn('w:fldCharType'), 'end')
    run._r.append(fc3)


def setup_margins(doc):
    for section in doc.sections:
        section.left_margin = Cm(3.0)
        section.right_margin = Cm(1.5)
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)


def appx_hdr(doc, letter, title):
    """Заголовок приложения."""
    para = doc.add_paragraph()
    fp(para, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sa=Pt(12), kwn=True)
    _outline(para, 0, page_break=True)
    rf(para.add_run(f'Приложение {letter}'), bold=True)
    cap = doc.add_paragraph()
    fp(cap, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sa=Pt(12))
    rf(cap.add_run(title))
    return cap


# =============================================================================
# ОСНОВНОЕ СОДЕРЖИМОЕ ДИПЛОМА
# =============================================================================

def main():
    doc = Document()
    setup_margins(doc)
    setup_footer(doc)

    # =========================================================================
    # ТИТУЛЬНЫЙ ЛИСТ
    # =========================================================================
    pp(doc, 'Министерство науки и высшего образования Российской Федерации',
       align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0))
    pp(doc, 'ФГАОУ ВО «Санкт-Петербургский политехнический университет Петра Великого»',
       align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0))
    pp(doc, 'Институт среднего профессионального образования',
       align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(24))
    pp(doc, 'ВЫПУСКНАЯ КВАЛИФИКАЦИОННАЯ РАБОТА', bold=True,
       align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(48))
    pp(doc,
       'Тема: Разработка системы отслеживания лекарственных препаратов\n'
       'в цепочке поставок на основе технологии блокчейн\n'
       '(Blockchain Pharma Tracking System / PharmaChain Trace)',
       bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(12))
    pp(doc, 'Специальность: 09.02.07 Информационные системы и программирование',
       align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(36))
    pp(doc, 'Студент: [ФИО автора]',
       align=WD_ALIGN_PARAGRAPH.LEFT, fi=Cm(0), sb=Pt(24))
    pp(doc, 'Группа: [номер группы]',
       align=WD_ALIGN_PARAGRAPH.LEFT, fi=Cm(0))
    pp(doc, 'Руководитель: [ФИО руководителя]',
       align=WD_ALIGN_PARAGRAPH.LEFT, fi=Cm(0), sb=Pt(12))
    pp(doc, 'Санкт-Петербург, [год]',
       align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(48))

    # =========================================================================
    # СОДЕРЖАНИЕ
    # =========================================================================
    hS(doc, 'СОДЕРЖАНИЕ')
    add_toc(doc)

    # =========================================================================
    # ОПРЕДЕЛЕНИЯ
    # =========================================================================
    hS(doc, 'ОПРЕДЕЛЕНИЯ, ОБОЗНАЧЕНИЯ И СОКРАЩЕНИЯ')
    pp(doc, f'API {EN} Application Programming Interface {EN} интерфейс программирования приложений.')
    pp(doc, f'DApp {EN} Decentralized Application {EN} децентрализованное приложение.')
    pp(doc, f'EVM {EN} Ethereum Virtual Machine {EN} виртуальная машина Ethereum.')
    pp(doc, f'GMP {EN} Good Manufacturing Practice {EN} надлежащая производственная практика.')
    pp(doc, f'GxP {EN} Good x Practice {EN} совокупность регуляторных требований к фармацевтической отрасли.')
    pp(doc, f'JWT {EN} JSON Web Token {EN} компактный токен для передачи данных с цифровой подписью (RFC 7519).')
    pp(doc, f'RBAC {EN} Role-Based Access Control {EN} управление доступом на основе ролей.')
    pp(doc, f'REST {EN} Representational State Transfer {EN} архитектурный стиль взаимодействия компонентов.')
    pp(doc, f'SPA {EN} Single Page Application {EN} одностраничное веб-приложение.')
    pp(doc, f'ABI {EN} Application Binary Interface {EN} описание интерфейса смарт-контракта для внешних вызовов.')
    pp(doc, f'DDL {EN} Data Definition Language {EN} язык определения структур базы данных.')
    pp(doc, f'JPA {EN} Jakarta Persistence API {EN} спецификация ORM для Java.')
    pp(doc, f'ORM {EN} Object-Relational Mapping {EN} технология отображения объектов на реляционные таблицы.')

    # =========================================================================
    # ВВЕДЕНИЕ
    # =========================================================================
    hS(doc, 'ВВЕДЕНИЕ')
    pp(doc,
       'Контрафактные лекарственные препараты представляют прямую угрозу жизни пациентов. '
       'По данным Всемирной организации здравоохранения, до 10 процентов лекарств на мировом '
       'рынке являются поддельными или несоответствующими стандартам качества [13]. '
       'Централизованные системы учёта движения препаратов не решают проблему доверия: '
       'администратор базы данных способен изменить историю поставки без следа, '
       'а потребитель не имеет независимого способа проверить подлинность продукта.')
    pp(doc,
       'В России с 2020 года действует система обязательной маркировки лекарств '
       '«Честный ЗНАК» (Постановление Правительства РФ N 1556) [12]. '
       'Она охватывает большинство лекарственных препаратов и фиксирует движение упаковок '
       'через операторов данных. Однако архитектура системы централизована: '
       'верификация подлинности зависит от одного оператора и недоступна для независимой проверки '
       'третьими сторонами.')
    pp(doc,
       'Технология блокчейн предоставляет альтернативный подход: данные о движении продукта '
       'хранятся в распределённом реестре, история операций неизменяема, '
       'а любой участник цепочки поставок может проверить подлинность независимо. '
       'Исследования в области борьбы с контрафактом подтверждают применимость блокчейна '
       'для фармацевтических цепочек поставок [14], [15].')
    pp(doc,
       'В работе разработан прототип системы PharmaChain Trace: '
       'Solidity смарт-контракт хранит неизменяемую историю каждого продукта, '
       'Spring Boot REST API обеспечивает авторизацию и хранение дополнительных метаданных, '
       'а React-интерфейс с MetaMask позволяет производителям, дистрибьюторам, аптекам '
       'и регуляторам взаимодействовать с контрактом.')
    pp(doc,
       'Целью работы является проектирование и разработка прототипа системы '
       'отслеживания лекарственных препаратов в цепочке поставок '
       'на основе технологии блокчейн.')
    pp(doc, 'Для достижения цели решены следующие задачи:', sa=Pt(0))
    li_n(doc, 1, 'анализ предметной области и формирование требований к системе')
    li_n(doc, 2, 'анализ существующих решений и обоснование целесообразности разработки')
    li_n(doc, 3, 'выбор технологического стека')
    li_n(doc, 4, 'проектирование архитектуры и схемы базы данных')
    li_n(doc, 5, 'разработка смарт-контракта, серверной и клиентской частей системы')
    li_n(doc, 6, 'тестирование реализованного приложения', last=True)
    pp(doc,
       'Объект исследования: процесс отслеживания движения лекарственных препаратов '
       'в цепочке поставок от производителя до потребителя.')
    pp(doc,
       'Предмет исследования: методы и технологии реализации системы верификации '
       'на основе смарт-контрактов Ethereum.')
    pp(doc,
       'Работа состоит из четырёх основных разделов и трёх приложений. '
       'Раздел 1 (Общая часть) содержит анализ предметной области, '
       'постановку задачи, функции проектируемого приложения, '
       'анализ рынка существующих решений, архитектуру приложения '
       'и обоснование выбора методики, технологии и инструментальных средств. '
       'Раздел 2 (Специальная часть) посвящён описанию структуры приложения, '
       'объектно-ориентированному проектированию, разработке пользовательского '
       'интерфейса и реализации системы. '
       'Раздел 3 (Экономическая часть) содержит обоснование области применения, '
       'расчёт трудоёмкости, затрат на разработку и внедрение, '
       'а также определение цены программного продукта. '
       'Раздел 4 (Техника безопасности и охрана труда) содержит анализ условий '
       'труда программиста, расчёт искусственного освещения, требования '
       'электробезопасности и пожарной безопасности. '
       'Приложение А содержит данные для экономической части (сводные таблицы '
       'расчётов). Приложение Б содержит исходный код смарт-контракта '
       'и серверной части. Приложение В содержит исходный код клиентской части.')

    # =========================================================================
    # РАЗДЕЛ 1
    # =========================================================================
    hR(doc, '1', 'ОБЩАЯ ЧАСТЬ')

    # -------------------------------------------------------------------------
    hP(doc, '1.1', 'Анализ предметной области', sb=Pt(12))
    pp(doc,
       'Фармацевтическая цепочка поставок охватывает путь лекарственного препарата '
       'от производителя через дистрибьютора до аптеки и конечного потребителя. '
       'Каждый этап этого пути регулируется требованиями GxP: Good Manufacturing Practice (GMP) '
       'регулирует производство, Good Distribution Practice (GDP) регулирует распределение [13]. '
       'Ключевым требованием служит прослеживаемость каждой упаковки на всём пути.')
    pp(doc,
       'Федеральный закон N 61-ФЗ «Об обращении лекарственных средств» [11] '
       'закрепляет требования к обороту препаратов на территории Российской Федерации. '
       'С 2020 года Постановление Правительства N 1556 ввело обязательную цифровую '
       'маркировку для большинства лекарственных препаратов [12]. '
       'Несмотря на это, централизованная архитектура системы не исключает ситуации, '
       'при которой недобросовестный участник может внести некорректные данные '
       'без возможности независимой проверки.')
    pp(doc,
       'Проблему фальсификации лекарств исследуют как регуляторы, так и научное сообщество. '
       'Mackey и Nayyar [14] систематизируют технологии борьбы с контрафактом '
       'и выделяют блокчейн как одну из наиболее перспективных, '
       'поскольку неизменяемость реестра исключает ретроактивные правки истории. '
       'Toyoda et al. [15] предлагают систему управления владением продуктом на блокчейне '
       'и демонстрируют её применимость для защиты цепочек поставок.')
    pp(doc,
       'На основе анализа предметной области сформированы функциональные требования к системе '
       '(таблица 1.1).')

    thdr(doc, '1.1', 'Функциональные требования к системе')
    mktable(doc,
        ['N', 'Требование', 'Описание'],
        [
            ['1', 'Регистрация участника', 'Создание учётной записи по адресу Ethereum-кошелька с назначением роли'],
            ['2', 'Аутентификация', 'Вход в систему с выдачей JWT-токена; поддержка refresh token'],
            ['3', 'Создание партии', 'Производитель создаёт партию on-chain с датами и хешами документов'],
            ['4', 'Создание продукта', 'Производитель регистрирует продукт с уникальным серийным номером on-chain'],
            ['5', 'Передача владения', 'Участник цепочки передаёт продукт следующему авторизованному актору'],
            ['6', 'Обновление статуса', 'Смена статуса: Manufactured, InTransit, Delivered, Sold'],
            ['7', 'Отзыв партии', 'Регулятор отзывает (recall) партию; все непроданные продукты блокируются'],
            ['8', 'Восстановление партии', 'Регулятор снимает отзыв (unrecall); продукты разблокируются'],
            ['9', 'Верификация продукта', 'Потребитель проверяет подлинность по серийному номеру или QR-коду'],
            ['10', 'История продукта', 'Просмотр полной цепочки владения и событий продукта'],
            ['11', 'Хранение метаданных', 'Хранение описания, номера партии и хеша температурного журнала off-chain'],
            ['12', 'Audit log', 'Запись всех действий участников в журнал аудита'],
            ['13', 'Аналитика', 'Счётчики продуктов, партий и событий через REST API'],
        ]
    )
    pp(doc, 'Нефункциональные требования к системе:', sa=Pt(0))
    li(doc, 'stateless-авторизация: сервер не хранит сессии (SessionCreationPolicy.STATELESS)')
    li(doc, 'CORS-фильтрация по конкретному frontend origin')
    li(doc, 'открытый API с документацией через Swagger/OpenAPI 3.0')
    li(doc, 'контейнеризация через Docker Compose для воспроизводимого развёртывания')
    li(doc, 'дедупликация событий блокчейна через уникальный составной индекс в PostgreSQL', last=True)

    # -------------------------------------------------------------------------
    hP(doc, '1.2', 'Постановка задачи')
    pp(doc,
       'На основе проведённого анализа предметной области сформулирована задача '
       'разработки прототипа информационной системы PharmaChain Trace, обеспечивающего '
       'непрерывное отслеживание движения лекарственных препаратов от производителя '
       'до конечного потребителя с использованием технологии блокчейн в качестве '
       'доверенного слоя данных.')
    pp(doc,
       'Задача разделяется на следующие подзадачи:')
    li_n(doc, 1,
       'спроектировать смарт-контракт на языке Solidity, реализующий иммутабельный '
       'реестр партий, продуктов и истории владения; обеспечить строгий контроль ролей '
       'через библиотеку OpenZeppelin AccessControl и анти-replay защиту через '
       'одноразовые operationId')
    li_n(doc, 2,
       'спроектировать реляционную базу данных PostgreSQL для off-chain метаданных '
       '(описания партий, температурные журналы, audit log, кэш событий блокчейна)')
    li_n(doc, 3,
       'разработать REST API на Spring Boot с авторизацией по подписи кошелька '
       'MetaMask (SIWE-like), хранением refresh-токенов с защитой от reuse '
       'и индексатором событий смарт-контракта')
    li_n(doc, 4,
       'разработать SPA-приложение на React + TypeScript + ethers.js с поддержкой '
       'MetaMask, QR-сканированием серийных номеров, контролем доступа на основе '
       'on-chain ролей и backend JWT-ролей')
    li_n(doc, 5,
       'обеспечить выполнение нефункциональных требований: безопасность '
       '(JWT HS256 с constant-time сравнением, псевдонимизация audit-логов, '
       'хеширование refresh-токенов), масштабируемость (O(1) recall партии), '
       'отказоустойчивость (idempotent индексер с конфирмациями)', last=True)
    pp(doc,
       'Критерием успешного решения задачи является работоспособный прототип, '
       'позволяющий производителю выпустить продукт, передать его по цепочке '
       'дистрибьютор → аптека, отозвать партию регулятором, а потребителю '
       'верифицировать подлинность по QR-коду или серийному номеру.')

    # -------------------------------------------------------------------------
    hP(doc, '1.3', 'Функции проектируемого приложения')
    pp(doc,
       'На основе анализа предметной области и поставленной задачи сформирован '
       'перечень функций, реализованных в системе (таблица 1.2).')

    thdr(doc, '1.2', 'Функции проектируемого приложения')
    mktable(doc,
        ['№', 'Функция', 'Актор', 'Слой реализации'],
        [
            ['1',  'Регистрация пользователя по wallet-адресу', 'Производитель / дистрибьютор / аптека / регулятор / потребитель', 'Backend (PostgreSQL)'],
            ['2',  'Вход в систему по подписи MetaMask (SIWE)', 'Авторизованный участник', 'Backend (JWT) + frontend (signer)'],
            ['3',  'Создание партии лекарственных препаратов', 'Производитель', 'Smart contract'],
            ['4',  'Создание продукта в партии с уникальным серийным номером', 'Производитель', 'Smart contract'],
            ['5',  'Передача владения продуктом', 'Производитель / дистрибьютор / аптека', 'Smart contract'],
            ['6',  'Обновление статуса продукта (InTransit → Delivered → Sold)', 'Текущий владелец', 'Smart contract'],
            ['7',  'Отзыв партии (recall) и восстановление (unrecall)', 'Регулятор', 'Smart contract'],
            ['8',  'Точечная блокировка отдельного продукта (block / unblock)', 'Регулятор', 'Smart contract'],
            ['9',  'Верификация продукта по QR-коду или серийному номеру', 'Потребитель (без авторизации)', 'Frontend + smart contract'],
            ['10', 'Просмотр полной истории продукта (timeline)', 'Авторизованный участник', 'Frontend + smart contract'],
            ['11', 'Хранение off-chain метаданных (описание, номер партии, хеши)', 'Производитель', 'Backend (PostgreSQL)'],
            ['12', 'Audit log всех бизнес-операций с псевдонимизацией wallet', 'Регулятор / администратор', 'Backend (PostgreSQL)'],
            ['13', 'Аналитика по событиям блокчейна', 'Авторизованный участник', 'Backend (PostgreSQL)'],
            ['14', 'Индексация событий смарт-контракта в PostgreSQL', 'Автоматически (cron-job)', 'Backend (Web3j)'],
            ['15', 'Управление пользователями и ролями', 'Администратор', 'Backend'],
        ]
    )
    pp(doc,
       'Функции с 3 по 8 реализованы непосредственно в смарт-контракте, '
       'что обеспечивает их неизменяемость и независимую проверяемость. '
       'Функции 9 и 10 объединяют клиентскую часть и контракт. '
       'Функции 1, 2, 11–15 относятся к off-chain слою и реализованы в backend.')

    # -------------------------------------------------------------------------
    hP(doc, '1.4', 'Анализ рынка существующих решений')
    pp(doc,
       'Для обоснования собственной разработки проанализированы пять существующих '
       'систем отслеживания фармацевтических цепочек поставок (таблица 1.3).')

    thdr(doc, '1.3', 'Сравнение существующих решений')
    mktable(doc,
        ['Система', 'Блокчейн', 'Открытый код', 'Consumer verify', 'Recall on-chain', 'Доступность'],
        [
            ['MediLedger Network', 'Quorum (Ethereum)', 'Нет', 'Нет', 'Частично', 'Закрытая сеть'],
            ['IBM Food Trust', 'Hyperledger Fabric', 'Нет', 'Нет', 'Нет', 'SaaS, платно'],
            ['SAP Track and Trace', 'Нет (СУБД)', 'Нет', 'Нет', 'Нет', 'Enterprise, платно'],
            ['Chronicled', 'Ethereum', 'Нет', 'Нет', 'Да', 'Закрытый API'],
            ['TraceLink', 'Нет (СУБД)', 'Нет', 'Нет', 'Нет', 'SaaS, платно'],
            ['PharmaChain Trace', 'Ethereum (Solidity)', 'Да', 'Да', 'Да', 'Open source MVP'],
        ]
    )
    pp(doc,
       'Ни одно из рассмотренных решений не предоставляет открытый исходный код '
       'для воспроизведения и изучения архитектуры. '
       'MediLedger и IBM Food Trust ориентированы на крупные фармацевтические корпорации '
       'и требуют подключения к закрытой корпоративной сети. '
       'SAP и TraceLink используют централизованные базы данных без блокчейна '
       'и не обеспечивают независимую верификацию продукта потребителем. '
       'Chronicled реализует recall on-chain, но работает через закрытый API '
       'и недоступна для изучения реализации.')
    pp(doc,
       'Разработка собственного прототипа обоснована необходимостью: '
       'изучить архитектуру блокчейн-системы отслеживания на открытом коде, '
       'реализовать независимую потребительскую верификацию, '
       'предоставить рабочий механизм recall on-chain '
       'и продемонстрировать разделение данных между блокчейном и реляционной СУБД.')

    # -------------------------------------------------------------------------
    hP(doc, '1.5', 'Архитектура приложения')
    pp(doc,
       'Для системы выбрана трёхуровневая клиент-серверная архитектура '
       'с блокчейном в качестве доверенного слоя данных. '
       'Клиентский уровень реализован как SPA на React с MetaMask для подписи транзакций. '
       'Серверный уровень реализован на Spring Boot и хранит метаданные в PostgreSQL. '
       'Блокчейн-уровень реализован на Solidity-контракте в сети Ethereum.')
    pp(doc,
       'Высокоуровневая компонентная диаграмма системы приведена на рисунке 1.1.')
    pp(doc, '[МЕСТО ДЛЯ РИСУНКА 1.1]', align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0))
    pp(doc, 'Рисунок 1.1 – Компонентная диаграмма системы PharmaChain Trace',
       align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sa=Pt(12))
    pp(doc,
       'Ключевой архитектурный принцип – разделение данных по уровню доверия. '
       'Критичные для верификации сведения (ID партии, серийный номер, владелец, '
       'статус, флаг recall, хеш метаданных, хеш температурного журнала) '
       'хранятся on-chain в смарт-контракте. Сопутствующие сведения, '
       'не требующие неизменяемости (текстовые описания, имена производителей, '
       'audit log, кэш событий, refresh-токены), хранятся off-chain в PostgreSQL.')
    pp(doc,
       'Между уровнями определены следующие протоколы взаимодействия:')
    li(doc, 'фронтенд → смарт-контракт: JSON-RPC через MetaMask и библиотеку ethers.js')
    li(doc, 'фронтенд → бэкенд: HTTPS REST с JWT в заголовке Authorization')
    li(doc, 'бэкенд → смарт-контракт: JSON-RPC через Web3j (только чтение для индексатора)')
    li(doc, 'бэкенд → СУБД: JPA / Hibernate поверх JDBC PostgreSQL', last=True)
    pp(doc,
       'Обоснование использования блокчейна вместо централизованной СУБД строится '
       'на нескольких конкретных свойствах. '
       'Во-первых, история движения продукта append-only: '
       'существующие записи не редактируются и не удаляются. '
       'Во-вторых, передача владения подписывается приватным ключом кошелька актора, '
       'что исключает фальсификацию «от имени» другого участника. '
       'В-третьих, отзыв (recall) партии регулятором немедленно виден всем участникам '
       'без участия централизованного оператора.')
    pp(doc,
       'Централизованная PostgreSQL при этом остаётся полезной для данных, '
       'не требующих доверия третьих сторон: '
       'текстовые описания, аналитика, audit log и кэш хешей транзакций. '
       'Такой гибридный подход снижает стоимость gas-операций '
       'и сохраняет привычный UX для REST-клиентов [1].')
    pp(doc,
       'Для развёртывания смарт-контракта выбрана локальная сеть Hardhat '
       'в режиме разработки, а также публичная тестовая сеть Ethereum Sepolia. '
       'Продуктивное развёртывание возможно в любой EVM-совместимой сети '
       'без изменения кода контракта.')
    pp(doc,
       'Паттерн State Machine реализован через перечисление Status '
       '(Manufactured, InTransit, Delivered, Sold, Recalled). '
       'Переходы между состояниями жёстко ограничены: '
       'только аптека может установить статус Sold, и только из состояния Delivered; '
       'отозванный продукт нельзя продать или передать.')

    # -------------------------------------------------------------------------
    hP(doc, '1.6', 'Обоснование и выбор методики, технологии и инструментальных средств проектирования и разработки')
    pp(doc,
       'Для обоснования выбора технологий проведено сравнение альтернатив '
       'по каждому компоненту системы.')

    thdr(doc, '1.3', 'Сравнение языков смарт-контрактов')
    mktable(doc,
        ['Язык', 'Экосистема', 'Документация', 'Библиотеки', 'Вывод'],
        [
            ['Solidity 0.8.24', 'Ethereum (EVM)', 'Обширная, актуальная', 'OpenZeppelin, Hardhat', 'Выбран'],
            ['Vyper 0.3.x', 'Ethereum (EVM)', 'Ограниченная', 'Минимальные', 'Не выбран'],
            ['Rust (Solana)', 'Solana (не EVM)', 'Развитая', 'Anchor framework', 'Не выбран'],
        ]
    )
    pp(doc,
       'Выбран Solidity 0.8.24 [2]. '
       'Ethereum является наиболее распространённой платформой для учебных и прикладных смарт-контрактов. '
       'Библиотека OpenZeppelin предоставляет верифицированные реализации AccessControl и других паттернов, '
       'что снижает риск ошибок в логике управления доступом [3]. '
       'Hardhat обеспечивает локальную EVM-ноду, покрытие кода и отладку [4].')

    thdr(doc, '1.4', 'Сравнение серверных технологий')
    mktable(doc,
        ['Технология', 'Типизация', 'Экосистема', 'ORM/JPA', 'Вывод'],
        [
            ['Java 17 + Spring Boot 3.3', 'Статическая', 'Enterprise-зрелая', 'Spring Data JPA', 'Выбран'],
            ['Node.js + Express 5', 'Динамическая (опц. TS)', 'Большая, фрагментированная', 'Sequelize/Prisma', 'Не выбран'],
            ['Python + Django 5', 'Динамическая (опц. type hints)', 'Большая', 'Django ORM', 'Не выбран'],
        ]
    )
    pp(doc,
       'Выбран Java 17 и Spring Boot 3.3.2 [5]. '
       'Статическая типизация Java сокращает число ошибок на этапе компиляции. '
       'Spring Boot предоставляет интегрированную экосистему: '
       'Spring Security для JWT-авторизации [6], Spring Data JPA для работы с PostgreSQL, '
       'SpringDoc OpenAPI для автоматической документации API. '
       'Web3j 4.10.3 [16] интегрируется в Spring-контекст и обеспечивает '
       'чтение событий контракта через eth_getLogs.')

    thdr(doc, '1.5', 'Сравнение систем управления базами данных')
    mktable(doc,
        ['СУБД', 'Модель', 'Транзакции', 'Типы данных', 'Вывод'],
        [
            ['PostgreSQL 16', 'Реляционная', 'ACID', 'JSONB, массивы, TIMESTAMPTZ', 'Выбран'],
            ['MySQL 8', 'Реляционная', 'ACID', 'Базовые', 'Не выбран'],
            ['MongoDB 7', 'Документная', 'Частичная', 'BSON', 'Не выбран'],
        ]
    )
    pp(doc,
       'Выбран PostgreSQL 16 [8]. '
       'Реляционная модель хорошо подходит для данных системы: '
       'пользователи, метаданные партий, события и токены связаны внешними ключами. '
       'ACID-транзакции гарантируют целостность при параллельной записи событий индексером. '
       'TIMESTAMPTZ корректно хранит временные метки без потери временной зоны.')

    thdr(doc, '1.6', 'Сравнение frontend-технологий')
    mktable(doc,
        ['Фреймворк', 'Язык', 'Экосистема', 'Web3-интеграция', 'Вывод'],
        [
            ['React 18 + TypeScript', 'TypeScript', 'Крупнейшая', 'ethers.js v6', 'Выбран'],
            ['Vue 3 + TypeScript', 'TypeScript', 'Средняя', 'ethers.js / web3.js', 'Не выбран'],
            ['Angular 17', 'TypeScript', 'Средняя', 'web3.js', 'Не выбран'],
        ]
    )
    pp(doc,
       'Выбран React 18.3.1 с TypeScript 5.5.3 [9]. '
       'React-хуки упрощают управление состоянием MetaMask-соединения. '
       'ethers.js 6.13.2 [10] предоставляет типизированный ABI-интерфейс к смарт-контракту '
       'и генерацию operationId через solidityPackedKeccak256. '
       'TailwindCSS 3.4.4 ускоряет построение role-based UI.')

    # =========================================================================
    # РАЗДЕЛ 2
    # =========================================================================
    hR(doc, '2', 'СПЕЦИАЛЬНАЯ ЧАСТЬ')
    pp(doc,
       'Специальная часть посвящена реализации поставленной в общей части задачи. '
       'Описаны структура программного решения, объектно-ориентированное '
       'проектирование с использованием UML и ER-диаграмм, разработка '
       'пользовательского интерфейса и реализация системы по слоям '
       '(смарт-контракт, серверная часть, клиентская часть). '
       'В конце раздела приведены результаты тестирования и описание '
       'методов обеспечения безопасности.')

    # -------------------------------------------------------------------------
    hP(doc, '2.1', 'Описание структуры приложения', sb=Pt(12))

    hPP(doc, '2.1.1', 'Диаграмма вариантов использования', sb=Pt(12))
    pp(doc,
       'В системе выделено пять акторов: Производитель (Manufacturer), '
       'Дистрибьютор (Distributor), Аптека (Pharmacy), Регулятор (Regulator) '
       'и Потребитель (Consumer). '
       'Диаграмма вариантов использования представлена на рисунке 2.1.')
    pp(doc,
       'Производитель создаёт партии и продукты, передаёт продукты дистрибьютору '
       'и просматривает аналитику. '
       'Дистрибьютор принимает продукты, обновляет статус и передаёт аптеке. '
       'Аптека принимает продукты, устанавливает статус Delivered и Sold. '
       'Регулятор отзывает небезопасные партии и восстанавливает их после проверки. '
       'Потребитель проверяет подлинность продукта по серийному номеру '
       'без регистрации в системе.')
    fig(doc, '2.1', 'Диаграмма вариантов использования')

    hPP(doc, '2.1.2', 'Проектирование базы данных')
    pp(doc,
       'Схема базы данных включает девять таблиц. '
       'Центральными для off-chain части служат таблицы app_users и product_batch_metadata. '
       'Таблица product_events кэширует события блокчейна для быстрого поиска. '
       'Таблица audit_logs накапливает журнал всех действий в системе.')

    hPPP(doc, '2.1.2.1', 'Концептуальная схема базы данных')
    pp(doc,
       'На концептуальном уровне определены сущности системы и связи между ними '
       'без привязки к конкретной СУБД. '
       'Схема включает следующие сущности: '
       'Пользователь (APP_USERS), Организация (ORGANIZATIONS), '
       'Метаданные продукта (PRODUCT_METADATA), '
       'Метаданные партии (PRODUCT_BATCH_METADATA), '
       'Событие продукта (PRODUCT_EVENTS), '
       'Журнал аудита (AUDIT_LOGS), '
       'Refresh-токен (REFRESH_TOKENS), '
       'Журнал температуры (TEMPERATURE_LOGS), '
       'Транзакция блокчейна (BLOCKCHAIN_TRANSACTIONS).')
    pp(doc,
       'Пользователь связан с Refresh-токенами отношением «один ко многим». '
       'Метаданные партии связаны с Событиями продукта и Журналом температуры. '
       'Концептуальная схема представлена на рисунке 2.2.')
    fig(doc, '2.2', 'Концептуальная схема базы данных')

    hPPP(doc, '2.1.2.2', 'Логическая схема базы данных')
    pp(doc,
       'На логическом уровне определены атрибуты каждой сущности, '
       'типы данных и ключевые поля. '
       'Первичные ключи во всех таблицах: поля id типа BIGSERIAL. '
       'В таблице app_users поле wallet_address несёт уникальное ограничение (UK): '
       'один кошелёк соответствует одному пользователю. '
       'Таблица product_events связана с product_batch_metadata '
       'через поле blockchain_batch_id. '
       'Логическая схема представлена на рисунке 2.3.')
    fig(doc, '2.3', 'Логическая схема базы данных')

    hPPP(doc, '2.1.2.3', 'Физическая схема базы данных')
    pp(doc,
       'На физическом уровне схема содержит DDL-инструкции для PostgreSQL 16: '
       'типы BIGSERIAL, VARCHAR, BOOLEAN, TIMESTAMPTZ, DATE, DOUBLE PRECISION. '
       'Ограничения целостности заданы через UNIQUE, NOT NULL, REFERENCES. '
       'На таблице product_events создан составной уникальный индекс '
       '(transaction_hash, event_type, blockchain_product_id) для дедупликации событий. '
       'Полный DDL-скрипт приведён в приложении А. '
       'Физическая схема представлена на рисунке 2.4.')
    fig(doc, '2.4', 'Физическая схема базы данных')

    hPP(doc, '2.1.3', 'Карта навигации')
    pp(doc,
       'Приложение реализовано как SPA с маршрутизацией через React Router 6.24.1. '
       'Карта навигации отражает страницы приложения и переходы между ними '
       '(рисунок 2.5). '
       'Публичные страницы: корневой дашборд (/), вход (/login) '
       'и верификация продукта (/verify) доступны без авторизации. '
       'Страницы кабинетов (/manufacturer, /distributor, /pharmacy) '
       'и операционные страницы (/register, /transfer, /recall, /history, /analytics) '
       'требуют авторизации с подходящей ролью. '
       'Переход в нужный кабинет происходит автоматически '
       'на основе роли, прочитанной из смарт-контракта.')
    fig(doc, '2.5', 'Карта навигации приложения')

    hPP(doc, '2.1.4', 'Диаграмма состояний продукта')
    pp(doc,
       'Продукт имеет явный жизненный цикл, описываемый перечислением Status. '
       'Диаграмма состояний показана на рисунке 2.6. '
       'Начальное состояние при создании: Manufactured. '
       'При передаче владения: InTransit. '
       'При подтверждении доставки: Delivered. '
       'При продаже аптекой: Sold (финальное, дальнейшие переходы запрещены). '
       'При отзыве регулятором: Recalled (продукт блокируется). '
       'При снятии отзыва: возврат в InTransit.')
    pp(doc,
       'Переход в Sold возможен только из состояния Delivered '
       'и только ролью PHARMACY_ROLE. '
       'Переход в Recalled выполняется только через функцию recallBatch, '
       'а не через updateStatus, '
       'что исключает несанкционированный перевод продукта в заблокированное состояние.')
    fig(doc, '2.6', 'Диаграмма состояний продукта')

    hPP(doc, '2.1.5', 'Диаграмма последовательности')
    pp(doc,
       'Диаграмма последовательности описывает типовой жизненный цикл продукта '
       '(рисунок 2.7). '
       'Производитель создаёт партию и продукт в смарт-контракте, '
       'затем сохраняет дополнительные метаданные через REST API. '
       'Далее производитель передаёт продукт дистрибьютору: '
       'транзакция подписывается MetaMask и отправляется в контракт. '
       'Дистрибьютор подтверждает получение, устанавливает статус Delivered '
       'и передаёт аптеке. '
       'Аптека устанавливает статус Sold. '
       'Потребитель выполняет вызов verifyProductBySerial напрямую к контракту '
       'и получает VerificationResult со всеми флагами.')
    fig(doc, '2.7', 'Диаграмма последовательности жизненного цикла продукта')

    hPP(doc, '2.1.6', 'Диаграмма компонентов системы')
    pp(doc,
       'Диаграмма компонентов показывает структурные части системы '
       'и протоколы взаимодействия между ними (рисунок 2.8). '
       'React-клиент взаимодействует со смарт-контрактом через MetaMask '
       'по протоколу JSON-RPC Ethereum. '
       'React-клиент взаимодействует со Spring Boot API по протоколу HTTPS/REST. '
       'Spring Boot API хранит данные в PostgreSQL 16 по JDBC. '
       'Опциональный сервис BlockchainEventIndexer читает события контракта '
       'через eth_getLogs и записывает их в PostgreSQL.')
    pp(doc,
       'Смарт-контракт хранится на узлах Ethereum-сети (локально: Hardhat, '
       'в тестовой сети: Sepolia). '
       'Spring Boot backend не реплицирует данные блокчейна в PostgreSQL: '
       'источником истины для владения, статусов и истории служит контракт. '
       'Backend хранит только дополнительные данные, не требующие доверия [18].')
    fig(doc, '2.8', 'Диаграмма компонентов системы')

    # -------------------------------------------------------------------------
    hP(doc, '2.2', 'Объектно-ориентированное проектирование системы')

    hPP(doc, '2.2.1', 'Структура проекта', sb=Pt(12))
    pp(doc,
       'Проект разделён на четыре директории верхнего уровня. '
       'Директория contracts содержит Solidity-контракт, конфигурацию Hardhat, '
       'скрипты деплоя и автоматические тесты. '
       'Директория backend содержит Spring Boot приложение: '
       'контроллеры, сервисы, сущности JPA, конфигурацию безопасности и Flyway-миграцию. '
       'Директория frontend содержит React SPA: '
       'страницы кабинетов, компоненты, утилиты ethers.js и стили TailwindCSS. '
       'Директория docs содержит техническую документацию: '
       'описание архитектуры, API, смарт-контракта, безопасности и деплоя.')

    hPP(doc, '2.2.2', 'Смарт-контракт')
    pp(doc,
       'Смарт-контракт SupplyChain.sol разработан на Solidity 0.8.24 [2] '
       'с использованием OpenZeppelin AccessControl 5.x [3]. '
       'Контракт содержит пять ролей: '
       'ADMIN_ROLE, MANUFACTURER_ROLE, DISTRIBUTOR_ROLE, PHARMACY_ROLE, REGULATOR_ROLE. '
       'Иерархия ролей задана через _setRoleAdmin: '
       'DEFAULT_ADMIN_ROLE управляет ADMIN_ROLE, '
       'ADMIN_ROLE управляет всеми ролями участников цепочки.')
    pp(doc,
       'Для хранения данных используются два структурных типа: '
       'ProductBatch (партия) и Product (продукт). '
       'Связь «один ко многим» между партией и продуктами реализована '
       'через mapping(uint256 => uint256[]) batchProducts. '
       'История каждого продукта хранится в mapping(uint256 => ProductHistory[]) productHistories: '
       'записи только добавляются, удаление не предусмотрено.')
    pp(doc,
       'Нетривиальным решением служит механизм anti-replay на основе operationId. '
       'Каждая бизнес-операция (передача, смена статуса, recall) требует уникального bytes32 параметра. '
       'Листинг 2.1 показывает реализацию этого механизма.')
    lhdr(doc, '2.1', 'Механизм anti-replay (SupplyChain.sol)')
    lblock(doc,
'mapping(bytes32 => bool) private usedOperationIds;\n'
'\n'
'modifier uniqueOperation(bytes32 operationId) {\n'
'    require(operationId != bytes32(0),\n'
'        "Operation id is required");\n'
'    require(!usedOperationIds[operationId],\n'
'        "Operation id already used");\n'
'    usedOperationIds[operationId] = true;\n'
'    _;\n'
'}'
    )
    pp(doc,
       'Клиентская сторона генерирует operationId как keccak256 от метки, UUID '
       'и текущего Unix-времени, что обеспечивает глобальную уникальность без координации с сервером.')
    pp(doc,
       'Функция verifyProduct возвращает VerificationResult за один view-вызов: '
       'флаги authentic, recalled, expired, blocked, текущий статус и владелец. '
       'Листинг 2.2 показывает её реализацию.')
    lhdr(doc, '2.2', 'Функция верификации продукта (SupplyChain.sol)')
    lblock(doc,
'function verifyProduct(uint256 productId)\n'
'    external view productExists(productId)\n'
'    returns (VerificationResult memory)\n'
'{\n'
'    Product memory product = products[productId];\n'
'    ProductBatch memory batch = batches[product.batchId];\n'
'    bool expired = block.timestamp > batch.expirationDate;\n'
'    return VerificationResult({\n'
'        authentic: product.exists && batch.exists,\n'
'        recalled: batch.recalled\n'
'                  || product.status == Status.Recalled,\n'
'        expired: expired,\n'
'        blocked: product.blocked,\n'
'        status: product.status,\n'
'        currentOwner: product.currentOwner,\n'
'        batchId: product.batchId,\n'
'        expirationDate: batch.expirationDate\n'
'    });\n'
'}'
    )
    pp(doc,
       'Функция recallBatch итерирует по всем продуктам партии и блокирует '
       'непроданные продукты. '
       'При unrecallBatch продукты со статусом Recalled возвращаются в InTransit: '
       'такое решение принято намеренно, поскольку исходный статус до recall '
       'мог быть любым, а InTransit однозначно сигнализирует о необходимости '
       'повторной проверки перед продажей. '
       'Полный листинг SupplyChain.sol приведён в листинге В.1.')

    hPP(doc, '2.2.3', 'Серверная часть')
    pp(doc,
       'Серверная часть реализована на Spring Boot 3.3.2 [5] с Java 17. '
       'Архитектура следует паттерну Controller-Service-Repository. '
       'Для работы с PostgreSQL 16 [8] используется Spring Data JPA '
       'с автоматическим управлением соединениями через HikariCP. '
       'Миграция схемы базы данных выполняется Flyway при старте приложения.')
    pp(doc,
       'JWT-авторизация реализована без сторонних библиотек (JJWT и аналоги не используются). '
       'Класс JwtService выполняет кодирование заголовка и payload в Base64URL, '
       'вычисляет HMAC-SHA256 подпись через javax.crypto.Mac. '
       'Листинг 2.3 показывает создание и разбор токена.')
    lhdr(doc, '2.3', 'Создание и разбор JWT-токена (JwtService.java)')
    lblock(doc,
'public String createToken(String walletAddress,\n'
'        UserRole role, Duration validFor) {\n'
'    String header = base64(\n'
'        "{\\"alg\\":\\"HS256\\",\\"typ\\":\\"JWT\\"}");\n'
'    long exp = Instant.now().plus(validFor)\n'
'                            .getEpochSecond();\n'
'    String payload = base64(String.format(\n'
'        "{\\"sub\\":\\"%s\\",\\"role\\":\\"%s\\",\\"exp\\":%d}",\n'
'        walletAddress.toLowerCase(), role.name(), exp));\n'
'    return header + "." + payload + "."\n'
'           + sign(header + "." + payload);\n'
'}\n'
'\n'
'public Optional<ParsedJwt> parseValidToken(String token) {\n'
'    String[] parts = token.split("\\\\.");\n'
'    if (parts.length != 3 ||\n'
'        !sign(parts[0]+"."+parts[1]).equals(parts[2]))\n'
'        return Optional.empty();\n'
'    try {\n'
'        byte[] dec = Base64.getUrlDecoder()\n'
'                           .decode(parts[1]);\n'
'        JsonNode node = MAPPER.readTree(\n'
'            new String(dec, StandardCharsets.UTF_8));\n'
'        if (Instant.now().getEpochSecond()\n'
'                >= node.get("exp").asLong())\n'
'            return Optional.empty();\n'
'        return Optional.of(new ParsedJwt(\n'
'            node.get("sub").asText(),\n'
'            UserRole.valueOf(\n'
'                node.get("role").asText())));\n'
'    } catch (Exception e) {\n'
'        return Optional.empty();\n'
'    }\n'
'}'
    )
    pp(doc,
       'Фильтр JwtAuthenticationFilter расширяет OncePerRequestFilter '
       'и регистрируется в цепочке Spring Security перед UsernamePasswordAuthenticationFilter. '
       'При наличии заголовка Authorization: Bearer фильтр разбирает токен '
       'и устанавливает UsernamePasswordAuthenticationToken в SecurityContext. '
       'Листинг 2.4 показывает логику фильтра.')
    lhdr(doc, '2.4', 'JWT-фильтр Spring Security (JwtAuthenticationFilter.java)')
    lblock(doc,
'@Override\n'
'protected void doFilterInternal(\n'
'        HttpServletRequest request,\n'
'        HttpServletResponse response,\n'
'        FilterChain filterChain)\n'
'        throws ServletException, IOException {\n'
'    String header = request.getHeader("Authorization");\n'
'    if (header != null && header.startsWith("Bearer ")) {\n'
'        String token = header.substring(7).trim();\n'
'        jwtService.parseValidToken(token)\n'
'            .ifPresent(parsed -> {\n'
'                var auth =\n'
'                    new UsernamePasswordAuthenticationToken(\n'
'                        parsed.walletAddress(), null,\n'
'                        List.of(new SimpleGrantedAuthority(\n'
'                            "ROLE_" + parsed.role().name())));\n'
'                SecurityContextHolder.getContext()\n'
'                    .setAuthentication(auth);\n'
'            });\n'
'    }\n'
'    filterChain.doFilter(request, response);\n'
'}'
    )
    pp(doc,
       'SecurityConfig настраивает правила авторизации запросов: '
       'GET-запросы к /api/** публичны, '
       'мутирующие запросы (POST, PUT, PATCH, DELETE) требуют валидного JWT. '
       'Этот режим управляется флагом require-authentication-for-mutations '
       'через переменную окружения, что упрощает локальную разработку без токена.')
    pp(doc,
       'Сервис BlockchainEventIndexerService реализует опциональную индексацию событий контракта. '
       'Spring-аннотация @Scheduled запускает метод indexEvents каждые 30 секунд (настраиваемо). '
       'Сервис запрашивает eth_getLogs через Web3j [16], '
       'фильтрует по topic-хешам событий BatchCreated, ProductCreated, ProductTransferred, '
       'BatchRecalled и сохраняет записи в таблицу product_events. '
       'Дедупликация обеспечивается уникальным индексом базы данных, '
       'поэтому повторный запрос тех же блоков не создаёт дублей.')
    pp(doc,
       'REST API задокументирован через SpringDoc OpenAPI 2.6.0: '
       'Swagger UI доступен по адресу http://localhost:8080/swagger-ui/index.html. '
       'Полный листинг SecurityConfig.java приведён в листинге В.4.')

    hPP(doc, '2.2.4', 'Клиентская часть')
    pp(doc,
       'Клиентская часть реализована как SPA на React 18.3.1 [9] '
       'с TypeScript 5.5.3 и Vite. '
       'Взаимодействие со смарт-контрактом реализовано через ethers.js 6.13.2 [10] '
       'в модуле frontend/src/lib/contract.ts. '
       'Модуль экспортирует типизированные функции: createBatch, createProduct, '
       'transferProduct, updateStatus, recallBatch, verifyProductBySerial и другие.')
    pp(doc,
       'Функция operationId генерирует уникальный bytes32 на клиенте: '
       'solidityPackedKeccak256(["string","uint256"], [label + crypto.randomUUID(), Date.now()]). '
       'Это исключает коллизии даже при быстрых последовательных операциях.')
    pp(doc,
       'Компонент WalletConnector читает роли адреса через вызов '
       'contract.hasRole(roleHash, address) для каждой роли. '
       'На основе полученного набора ролей компонент Navigation формирует '
       'ссылки в боковом меню: производитель видит /manufacturer и /register, '
       'регулятор видит /recall и т.д. '
       'Это role-based navigation выполняется on-chain, '
       'а не по JWT-роли из backend, что исключает рассинхронизацию прав.')
    pp(doc,
       'Компонент SupplyChainTimeline читает productHistories из контракта '
       'и отображает хронологический список событий: '
       'дата, актор (адрес кошелька), предыдущий и новый владелец, '
       'статус и action-строка. '
       'Этот компонент используется на странице /verify '
       'и на странице /products/:id. '
       'Полный листинг App.tsx приведён в листинге В.5.')

    hPP(doc, '2.2.5', 'Демонстрация функционала')
    pp(doc,
       'На рисунке 2.9 показан кабинет производителя: '
       'форма создания партии с полями дат и хешей документов, '
       'форма создания продукта с серийным номером, '
       'список партий и продуктов текущего кошелька.')
    fig(doc, '2.9', 'Кабинет производителя (/manufacturer)')
    pp(doc,
       'На рисунке 2.10 показана страница верификации продукта. '
       'Потребитель вводит серийный номер или сканирует QR-код. '
       'Страница отображает статус подлинности, срок годности, recall-предупреждение '
       'и компонент SupplyChainTimeline с историей движения продукта. '
       'Вся информация читается напрямую из смарт-контракта без участия backend.')
    fig(doc, '2.10', 'Страница верификации продукта (/verify)')
    pp(doc,
       'На рисунке 2.11 показан кабинет регулятора. '
       'Регулятор вводит batchId и причину отзыва, '
       'подтверждает транзакцию в MetaMask. '
       'После подтверждения все непроданные продукты партии '
       'получают статус Recalled и флаг blocked = true.')
    fig(doc, '2.11', 'Кабинет регулятора (/recall)')
    pp(doc,
       'Реализованный функционал соответствует функциональным требованиям из раздела 1.1: '
       'все тринадцать требований реализованы и проверены в ходе тестирования.')

    # -------------------------------------------------------------------------
    hP(doc, '2.3', 'Разработка пользовательского интерфейса')
    pp(doc,
       'Пользовательский интерфейс реализован как одностраничное приложение '
       'на React 18 с TypeScript. Маршрутизация построена через React Router v6, '
       'стилизация выполнена с использованием TailwindCSS, иконки – Lucide React. '
       'Глобальное состояние подключённого кошелька и JWT хранится в двух '
       'контекстах – WalletContext и AuthContext.')
    pp(doc,
       'Структура страниц соответствует ролевой модели: для каждой роли '
       '(производитель, дистрибьютор, аптека, регулятор, потребитель) '
       'предусмотрен отдельный кабинет с соответствующим набором операций. '
       'Карта навигации представлена на рисунке 2.15.')
    pp(doc, '[МЕСТО ДЛЯ РИСУНКА 2.15]', align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0))
    pp(doc, 'Рисунок 2.15 – Карта навигации приложения по ролям',
       align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sa=Pt(12))
    pp(doc,
       'Доступ к страницам контролируется компонентом ProtectedRoute, '
       'который проверяет наличие нужной роли в JWT (allowedBackendRoles) '
       'либо в списке on-chain ролей (allowedWalletRoles), а также может '
       'требовать наличия подключённого кошелька и корректной сети. '
       'При отсутствии прав отображается понятное сообщение с кнопками '
       '«Подключить кошелёк», «Войти», «Переключить сеть».')
    pp(doc,
       'Скриншоты ключевых страниц UI см. на рисунках 2.9–2.11 в разделе 2.2 '
       '«Демонстрация функционала».')
    pp(doc,
       'Для предотвращения ошибки BigNumberish (когда пользователь вводит '
       'строковый номер партии вроде «BATCH-2026-001» в числовое поле on-chain ID) '
       'все числовые идентификаторы проходят валидацию на стороне клиента до '
       'отправки в смарт-контракт. Идентификаторы чётко разделены в подписях '
       'полей: «Blockchain product ID (число)», «Серийный номер с упаковки» '
       'и т.п. (см. документ docs/id-model.md).')
    pp(doc,
       'Состояние смены статуса контролируется конечным автоматом: после ввода '
       'ID продукта система загружает текущий статус, отключает в выпадающем '
       'списке текущий статус и все недопустимые переходы. Кнопка отправки '
       'транзакции деактивирована до тех пор, пока выбранный переход недопустим. '
       'Это исключает класс ошибок, связанных с непониманием правил жизненного '
       'цикла продукта (повторный «Доставлен», попытка перейти из «Произведён» '
       'сразу в «Продан»).')

    # -------------------------------------------------------------------------
    hP(doc, '2.4', 'Реализация системы')
    pp(doc,
       'Реализация системы разделена на три независимо собираемых модуля, '
       'каждый со своим жизненным циклом сборки и тестирования: '
       'смарт-контракт (Hardhat), серверная часть (Maven), '
       'клиентская часть (Vite).')
    pp(doc, 'Смарт-контракт SupplyChain.sol компилируется компилятором '
       'solc-0.8.24 с целевой версией EVM Paris. Используется библиотека '
       'OpenZeppelin AccessControl v5 для управления ролями. Тестирование '
       'выполняется фреймворком Hardhat с библиотеками chai и ethers.js v6. '
       'Контракт содержит 12 модульных тестов, покрывающих создание партии, '
       'создание продукта, передачу владения, смену статуса, отзыв партии, '
       'восстановление, точечную блокировку и проверки контроля доступа.')
    pp(doc, 'Серверная часть собирается Maven 3.9, версия Java – 17, '
       'фреймворк – Spring Boot 3.3.2. Используются модули Spring Web, '
       'Spring Security, Spring Data JPA, Flyway, Spring Boot Actuator, '
       'springdoc-openapi и Web3j 4.10.3. База данных – PostgreSQL 16; '
       'схема управляется через миграции Flyway V1–V5. Тестирование выполняется '
       'JUnit 5 поверх H2 in-memory и Spring Security Test. '
       'Реализовано 37 модульных и интеграционных тестов.')
    pp(doc, 'Клиентская часть собирается Vite 5 с TypeScript в строгом режиме. '
       'Используются библиотеки react, react-router-dom, ethers, qrcode.react, '
       'html5-qrcode, lucide-react. Тестирование выполняется Vitest; реализовано '
       '58 модульных тестов на утилиты валидации, маршрутизацию навигации, '
       'парсинг JWT и QR-кодов, обработку ошибок.')
    pp(doc, 'Демонстрация основных операций приведена на рисунках 2.12–2.14.')
    pp(doc, '[МЕСТО ДЛЯ РИСУНКА 2.12]', align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0))
    pp(doc, 'Рисунок 2.12 – Создание партии и продукта производителем',
       align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sa=Pt(12))
    pp(doc, '[МЕСТО ДЛЯ РИСУНКА 2.13]', align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0))
    pp(doc, 'Рисунок 2.13 – Передача продукта по цепочке и обновление статуса',
       align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sa=Pt(12))
    pp(doc, '[МЕСТО ДЛЯ РИСУНКА 2.14]', align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0))
    pp(doc, 'Рисунок 2.14 – Отзыв партии регулятором и блокировка продукта',
       align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sa=Pt(12))

    # -------------------------------------------------------------------------
    hP(doc, '2.5', 'Тестирование')
    pp(doc,
       'Для тестирования смарт-контракта применён фреймворк Hardhat с библиотекой Chai. '
       'Тесты находятся в файле contracts/test/SupplyChain.test.ts. '
       'Всего разработано девять автоматических тест-кейсов, '
       'охватывающих создание партий и продуктов, anti-replay operationId, '
       'передачу между авторизованными акторами, recall и unrecall партии, '
       'продажу только аптекой и иммутабельность истории.')
    pp(doc,
       'Для серверной части применено интеграционное тестирование через Spring Boot Test '
       'с in-memory базой данных H2. '
       'Тесты проверяют работу JWT-генерации, разбора токена и логику SecurityConfig.')
    pp(doc,
       'Функциональное ручное тестирование проводилось сценарным методом: '
       'для каждого функционального блока составлены позитивные, '
       'граничные и негативные сценарии. '
       'Критерии выбора тестовых сценариев: '
       'покрытие всех ролей, всех переходов статусов и всех защитных require-условий контракта. '
       'Всего разработано 55 тест-кейсов по девяти функциональным областям. '
       'Все тест-кейсы выполнены со статусом «Пройден». '
       'Тест-кейсы приведены в приложении Б.')

    # -------------------------------------------------------------------------
    hP(doc, '2.6', 'Методы обеспечения безопасности')
    pp(doc,
       'В системе реализован многоуровневый подход к безопасности: '
       'на уровне смарт-контракта, на уровне JWT-авторизации и на уровне REST API.')
    pp(doc, 'Безопасность смарт-контракта обеспечивается следующими мерами:', sa=Pt(0))
    li(doc,
       'управление ролями через OpenZeppelin AccessControl [3]: '
       'проверка роли выполняется при каждом вызове защищённой функции; '
       'ошибка доступа reverts транзакцию')
    li(doc,
       'anti-replay через operationId: '
       'каждый уникальный bytes32 фиксируется в mapping usedOperationIds; '
       'повторный вызов с тем же операндом отклоняется')
    li(doc,
       'защита от дублирования серийных номеров: '
       'mapping productIdBySerial проверяет уникальность на этапе createProduct')
    li(doc,
       'ограничение передачи: только авторизованные supply-chain акторы '
       '(производитель, дистрибьютор, аптека) могут передавать и получать продукты')
    li(doc,
       'блокировка recalled продуктов: '
       'флаг blocked проверяется модификатором notBlocked до выполнения операции', last=True)
    pp(doc,
       'JWT-авторизация реализована по стандарту RFC 7519 [7]. '
       'Алгоритм подписи: HMAC-SHA256 (HS256). '
       'Токен содержит поля sub (wallet_address), role и exp (время истечения). '
       'Время жизни access-токена: 24 часа. '
       'Refresh-токены хранятся в PostgreSQL как хеш SHA-256 '
       'и имеют срок действия, управляемый сервисом RefreshTokenService.')
    pp(doc,
       'Spring Security [6] настроен в stateless-режиме: '
       'сессии не создаются (SessionCreationPolicy.STATELESS). '
       'GET-запросы к /api/** открыты для чтения данных потребителем без аутентификации. '
       'POST, PUT, PATCH, DELETE требуют валидного JWT. '
       'Исключения: /api/auth/login и POST /api/users для регистрации.')
    pp(doc,
       'Защита от SQL-инъекций обеспечена через JPA: '
       'все запросы к PostgreSQL выполняются через параметризованные PreparedStatement; '
       'пользовательские данные не конкатенируются в строку SQL.')
    pp(doc,
       'CORS настроен на явный frontend origin через переменную окружения FRONTEND_ORIGIN: '
       'разрешены только методы GET, POST, PUT, PATCH, DELETE, OPTIONS '
       'с конкретных доменов.')
    pp(doc,
       'Конфиденциальные документы (температурные журналы, сертификаты партии) '
       'хранятся off-chain. '
       'На блокчейне фиксируется только bytes32-хеш документа: '
       'это позволяет верифицировать целостность документа без его публикации в открытом реестре.')

    # =========================================================================
    # РАЗДЕЛ 3
    # =========================================================================
    hR(doc, '3', 'ЭКОНОМИЧЕСКАЯ ЧАСТЬ')

    # -------------------------------------------------------------------------
    hP(doc, '3.1', 'Область применения программного продукта и его преимущества перед аналогичным программным продуктом', sb=Pt(12))
    pp(doc,
       'Разработанный программный продукт PharmaChain Trace предназначен для '
       'отслеживания движения лекарственных препаратов по всей цепочке поставок '
       'от производителя до конечного потребителя с использованием технологии '
       'блокчейн в качестве доверенного слоя данных.')
    pp(doc, 'Потенциальные пользователи системы:')
    li(doc, 'фармацевтические производители, заинтересованные в предоставлении конечному покупателю независимой верификации подлинности препарата')
    li(doc, 'дистрибьюторы и логистические операторы, фиксирующие приём и передачу партий товара')
    li(doc, 'аптечные сети, ведущие учёт поступлений и продаж')
    li(doc, 'регуляторные органы (Росздравнадзор, Минздрав), осуществляющие надзор за качеством лекарственных средств и отзыв опасных партий')
    li(doc, 'конечные потребители, желающие убедиться в подлинности приобретённого препарата без необходимости регистрации в системе', last=True)
    pp(doc,
       'Сравнение PharmaChain Trace с аналогичными программными продуктами '
       'приведено в таблице 3.1.')

    thdr(doc, '3.1', 'Сравнение PharmaChain Trace с аналогами')
    mktable(doc,
        ['Критерий', 'PharmaChain Trace', 'MediLedger Network', 'IBM Food Trust', 'Честный ЗНАК'],
        [
            ['Технология реестра',          'Ethereum / EVM',          'Quorum (закрытый)',      'Hyperledger Fabric',     'Централизованная СУБД'],
            ['Открытый исходный код',       'Да',                       'Нет',                    'Нет',                    'Нет'],
            ['Независимая верификация потребителем', 'Да (QR без регистрации)', 'Нет',           'Нет',                    'Через приложение'],
            ['Recall on-chain (O(1))',      'Да',                       'Частично',               'Нет',                    'Нет'],
            ['Лицензионные платежи',        'Отсутствуют',              'По договору',            'От 3 000 000 руб/год',   'Государственный оператор'],
            ['Возможность доработки',       'Полная',                   'Закрытая сеть',          'Ограниченная',           'Через регулятора'],
            ['Псевдонимизация audit log',   'HMAC-SHA256 + pepper',     'Нет данных',             'Нет',                    'Нет'],
            ['Развёртывание on-premise',    'Да (Docker Compose)',      'Нет',                    'Только SaaS',            'Нет'],
        ]
    )
    pp(doc,
       'Главные конкурентные преимущества разработанной системы: '
       'открытый исходный код, отсутствие ежегодных лицензионных платежей, '
       'возможность развёртывания на собственной инфраструктуре, '
       'независимая верификация подлинности потребителем без регистрации в системе, '
       'O(1) реализация отзыва партии (recall) с псевдонимизацией данных в audit log.')

    # -------------------------------------------------------------------------
    hP(doc, '3.2', 'Трудоёмкость разработки программного продукта, квалификация исполнителя и его оклад')
    pp(doc,
       'Разработка выполнена одним инженером уровня middle full-stack developer '
       'со специализацией в blockchain-разработке. Требуемые квалификационные '
       'компетенции: Solidity 0.8.x, OpenZeppelin AccessControl, Hardhat, '
       'Java 17, Spring Boot 3, Spring Security, JPA / Hibernate, Flyway, '
       'Web3j, React 18, TypeScript, ethers.js v6, PostgreSQL 16, Docker.')
    pp(doc,
       'Трудоёмкость разработки определена методом экспертной оценки '
       'на основе декомпозиции по этапам жизненного цикла программного '
       'обеспечения (таблица 3.2).')

    thdr(doc, '3.2', 'Декомпозиция трудоёмкости разработки')
    mktable(doc,
        ['Этап', 'Содержание работ', 'Трудоёмкость, ч'],
        [
            ['Анализ требований и предметной области', 'Изучение GxP / GMP, обзор аналогов (MediLedger, IBM Food Trust, Честный ЗНАК), формирование функциональных и нефункциональных требований', '40'],
            ['Проектирование архитектуры',             'Трёхуровневая архитектура, схема БД, диаграммы UML / ER, спецификация REST API', '40'],
            ['Разработка смарт-контракта',             'Solidity-контракт SupplyChain.sol, 12 автоматических тестов Hardhat, скрипты деплоя', '60'],
            ['Разработка серверной части',             'Spring Boot REST API, SIWE-аутентификация, JWT, Flyway-миграции, индексер блокчейн-событий, Swagger', '90'],
            ['Разработка клиентской части',            'React SPA с TypeScript, ethers.js, кабинеты ролей, QR-сканер, ProtectedRoute, WalletContext / AuthContext', '70'],
            ['Автоматическое тестирование',            'Hardhat (12), JUnit + H2 (37), Vitest (58)', '20'],
            ['Ручное тестирование и отладка',          'Прохождение тест-кейсов, исправление дефектов, проверка end-to-end сценариев', '20'],
            ['Документирование',                       'README, security.md, indexer.md, id-model.md, mobile-testing.md, qr-verification.md, пояснительная записка', '30'],
            ['Итого',                                  '',                                          '370'],
        ]
    )
    pp(doc,
       'Месячный оклад middle full-stack разработчика в Санкт-Петербурге '
       'по данным агрегаторов вакансий составляет от 180 000 до 280 000 рублей. '
       'Для расчётов принят средний оклад в размере 220 000 рублей в месяц '
       'при норме 168 рабочих часов в месяц (40-часовая рабочая неделя).')
    pp(doc, 'Часовая ставка исполнителя определяется по формуле (3.1):')
    formula = doc.add_paragraph()
    fp(formula, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(6), sa=Pt(6))
    rf(formula.add_run('S = O / N = 220 000 / 168 ≈ 1 310 руб./ч,     (3.1)'))
    pp(doc, 'где S – часовая ставка исполнителя, руб./ч; O – месячный оклад, руб.; N – месячный фонд рабочего времени, ч.')

    # -------------------------------------------------------------------------
    hP(doc, '3.3', 'Расчёт затрат на разработку информационных технологий')
    pp(doc,
       'Затраты на разработку определяются как сумма прямых затрат на оплату труда, '
       'отчислений в социальные фонды, амортизации оборудования, расходов на '
       'программное обеспечение и накладных расходов (таблица 3.3).')

    pp(doc, 'Прямые затраты на оплату труда исполнителя рассчитываются по формуле (3.2):')
    formula = doc.add_paragraph()
    fp(formula, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(6), sa=Pt(6))
    rf(formula.add_run('З_от = T · S = 370 · 1 310 = 484 700 руб.     (3.2)'))
    pp(doc, 'где T – суммарная трудоёмкость разработки, ч; S – часовая ставка исполнителя, руб./ч.')

    pp(doc, 'Отчисления в социальные фонды по совокупному тарифу 30 % (22 % ПФР, 5,1 % ФОМС, 2,9 % ФСС) рассчитываются по формуле (3.3):')
    formula = doc.add_paragraph()
    fp(formula, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(6), sa=Pt(6))
    rf(formula.add_run('З_соц = З_от · 0,30 = 484 700 · 0,30 = 145 410 руб.     (3.3)'))

    pp(doc, 'Амортизация оборудования (ноутбук стоимостью 150 000 руб., нормативный срок службы 3 года, использовано 2,3 месяца) рассчитывается по формуле (3.4):')
    formula = doc.add_paragraph()
    fp(formula, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(6), sa=Pt(6))
    rf(formula.add_run('А = (Ц_об / T_сл) · (T_р / 12) = (150 000 / 3) · (2,3 / 12) ≈ 9 583 руб.     (3.4)'))
    pp(doc, 'где Ц_об – цена оборудования, руб.; T_сл – срок службы, лет; T_р – время использования, мес.')

    pp(doc, 'Затраты на лицензии для разработки: '
       'IntelliJ IDEA Ultimate – 15 600 руб./год (использовано 2,3 мес. ≈ 2 990 руб.), '
       'OpenZeppelin – бесплатно (MIT), Hardhat – бесплатно (MIT), '
       'GitHub Pro – 4 800 руб./год (≈ 920 руб.). Итого: 3 910 руб.')

    pp(doc, 'Накладные расходы (электроэнергия, аренда рабочего места, '
       'связь и интернет) принимаются в размере 20 % от прямых затрат на оплату труда: '
       '484 700 · 0,20 = 96 940 руб.')

    thdr(doc, '3.3', 'Структура затрат на разработку программного продукта')
    mktable(doc,
        ['Статья затрат', 'Сумма, руб.', 'Доля, %'],
        [
            ['Заработная плата исполнителя',     '484 700',  '67,6 %'],
            ['Отчисления в социальные фонды',    '145 410',  '20,3 %'],
            ['Амортизация оборудования',         '9 583',    '1,3 %'],
            ['Программное обеспечение / лицензии','3 910',    '0,5 %'],
            ['Накладные расходы',                '96 940',   '13,5 %'],
            ['Резерв непредвиденных расходов (3 %)', '21 615', '3,0 %'],
            ['Итого затраты на разработку',      '762 158',  '100,0 %'],
        ]
    )
    pp(doc, 'Итоговые затраты на разработку программного продукта составляют 762 158 рублей.')

    # -------------------------------------------------------------------------
    hP(doc, '3.4', 'Расчёт затрат на внедрение информационных технологий')
    pp(doc,
       'Внедрение программного продукта у заказчика включает установку '
       'и настройку программного обеспечения, разворачивание смарт-контракта '
       'в выбранной EVM-совместимой сети, развёртывание серверной части и '
       'базы данных, импорт первичных данных пользователей, проведение '
       'обучения персонала и сопровождение в течение гарантийного периода. '
       'Структура затрат на внедрение приведена в таблице 3.4.')

    thdr(doc, '3.4', 'Структура затрат на внедрение программного продукта')
    mktable(doc,
        ['Статья затрат на внедрение', 'Норма, ч', 'Стоимость, руб.'],
        [
            ['Деплой смарт-контракта (включая газ публикации в сети и аудит транзакции)', '8', '10 480'],
            ['Установка и конфигурирование серверной части (Docker Compose, PostgreSQL, Flyway-миграции, JWT-секрет)', '12', '15 720'],
            ['Настройка индексатора блокчейн-событий, BLOCKCHAIN_START_BLOCK', '6', '7 860'],
            ['Развёртывание клиентской части, конфигурирование nginx и VITE_PUBLIC_APP_URL', '6', '7 860'],
            ['Регистрация пользователей и назначение ролей через POST /api/users (administrative bootstrap)', '8', '10 480'],
            ['Обучение пользователей (по 2 ч на роль × 4 роли)', '8', '10 480'],
            ['Сопровождение в период опытной эксплуатации (1 неделя)', '20', '26 200'],
            ['Итого затраты на внедрение', '68', '89 080'],
        ]
    )
    pp(doc, 'Дополнительно учитываются разовые расходы на аппаратную инфраструктуру:')
    li(doc, 'облачный сервер для PostgreSQL и backend (VPS 4 vCPU / 8 GB) – 4 800 руб./мес')
    li(doc, 'оплата сетевых ресурсов (RPC-провайдер Ethereum для индексатора) – 0–3 000 руб./мес в зависимости от тарифа Infura / Alchemy', last=True)
    pp(doc, 'Совокупная стоимость внедрения и инфраструктуры в первый месяц эксплуатации не превышает 100 000 рублей.')

    # -------------------------------------------------------------------------
    hP(doc, '3.5', 'Определение цены программного продукта, который разработан одной организацией по заказу другой')
    pp(doc,
       'Цена программного продукта, разработанного по договору одной '
       'организацией для другой, определяется как сумма полной себестоимости '
       'разработки и внедрения, плановой прибыли разработчика и налога '
       'на добавленную стоимость (НДС).')

    pp(doc, 'Полная себестоимость рассчитывается по формуле (3.5):')
    formula = doc.add_paragraph()
    fp(formula, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(6), sa=Pt(6))
    rf(formula.add_run('C_полн = З_разр + З_внедр = 762 158 + 89 080 = 851 238 руб.     (3.5)'))
    pp(doc, 'где З_разр – затраты на разработку, руб.; З_внедр – затраты на внедрение, руб.')

    pp(doc, 'Плановая прибыль разработчика принимается в размере 25 % от полной себестоимости (формула 3.6):')
    formula = doc.add_paragraph()
    fp(formula, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(6), sa=Pt(6))
    rf(formula.add_run('П = C_полн · R = 851 238 · 0,25 ≈ 212 810 руб.     (3.6)'))
    pp(doc, 'где П – прибыль, руб.; R – норма прибыли (рентабельность), доля.')

    pp(doc, 'Оптовая цена (без НДС) определяется по формуле (3.7):')
    formula = doc.add_paragraph()
    fp(formula, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(6), sa=Pt(6))
    rf(formula.add_run('Ц_опт = C_полн + П = 851 238 + 212 810 = 1 064 048 руб.     (3.7)'))

    pp(doc, 'Цена для заказчика с учётом налога на добавленную стоимость (20 %, ставка НК РФ для разработки ПО, не подпадающего под льготы IT-аккредитации) определяется по формуле (3.8):')
    formula = doc.add_paragraph()
    fp(formula, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(6), sa=Pt(6))
    rf(formula.add_run('Ц = Ц_опт · (1 + НДС) = 1 064 048 · 1,20 ≈ 1 276 858 руб.     (3.8)'))

    pp(doc,
       'Итоговая цена программного продукта PharmaChain Trace для заказчика '
       'составляет 1 276 858 рублей с НДС 20 %.')

    pp(doc, 'Сводный расчёт цены приведён в таблице 3.5.')
    thdr(doc, '3.5', 'Расчёт цены программного продукта по заказу')
    mktable(doc,
        ['Показатель', 'Сумма, руб.'],
        [
            ['Затраты на разработку, З_разр',           '762 158'],
            ['Затраты на внедрение, З_внедр',           '89 080'],
            ['Полная себестоимость, C_полн',            '851 238'],
            ['Плановая прибыль (25 %), П',              '212 810'],
            ['Оптовая цена (без НДС), Ц_опт',           '1 064 048'],
            ['НДС 20 %',                                '212 810'],
            ['Цена для заказчика, Ц',                   '1 276 858'],
        ]
    )
    pp(doc,
       'При сравнении с альтернативой в виде ежегодной подписки на SaaS-аналог '
       '(от 3 000 000 руб./год) разовая оплата собственной разработки '
       'окупается за пять месяцев и в дальнейшем приносит ежегодную '
       'экономию более 2,9 млн рублей при отсутствии лицензионных платежей.')

    # =========================================================================
    # РАЗДЕЛ 4 — ТЕХНИКА БЕЗОПАСНОСТИ И ОХРАНА ТРУДА
    # =========================================================================
    hR(doc, '4', 'ТЕХНИКА БЕЗОПАСНОСТИ И ОХРАНА ТРУДА')

    # -------------------------------------------------------------------------
    hP(doc, '4.1', 'Анализ условий труда программиста', sb=Pt(12))
    pp(doc,
       'Рабочее место программиста относится к категории работ I-а '
       '(работа, выполняемая сидя и сопровождающаяся незначительным '
       'физическим напряжением) согласно СанПиН 1.2.3685-21 «Гигиенические '
       'нормативы и требования к обеспечению безопасности и (или) безвредности '
       'для человека факторов среды обитания». Основные вредные и опасные '
       'факторы, воздействующие на программиста:')
    li(doc, 'повышенный уровень электромагнитного излучения от компьютерной техники')
    li(doc, 'недостаточная освещённость рабочего места и блики на экране')
    li(doc, 'повышенный уровень шума от вентиляторов системного блока, сервера, кондиционера')
    li(doc, 'статическое напряжение мышц спины и кистей рук при длительной работе с клавиатурой')
    li(doc, 'зрительное переутомление при длительной работе с экраном монитора')
    li(doc, 'опасность поражения электрическим током', last=True)
    pp(doc,
       'Нормативные требования к параметрам микроклимата и освещения '
       'рабочего места программиста приведены в таблице 4.1.')

    thdr(doc, '4.1', 'Нормативные параметры рабочего места программиста (СанПиН 1.2.3685-21)')
    mktable(doc,
        ['Параметр', 'Норматив', 'Фактическое значение'],
        [
            ['Температура воздуха, °C',           '22–24',                    '23'],
            ['Относительная влажность воздуха, %', '40–60',                   '50'],
            ['Скорость движения воздуха, м/с',    'не более 0,1',             '0,05'],
            ['Уровень шума, дБА',                 'не более 50',              '45'],
            ['Освещённость рабочей поверхности, лк', '300–500',               'см. п. 4.2'],
            ['Площадь рабочего места, м²',        'не менее 4,5',             '6'],
            ['Объём рабочего места, м³',          'не менее 15',              '18'],
            ['Расстояние до монитора, м',         '0,6–0,7',                  '0,65'],
        ]
    )
    pp(doc,
       'Для снижения влияния вредных факторов применяются: '
       'регламентированные перерывы в работе (по 10–15 минут через каждые '
       '45–60 минут согласно ТОИ Р-45-084-01), гимнастика для глаз и '
       'опорно-двигательного аппарата, эргономичное офисное кресло '
       'с регулировкой высоты, спинки и подлокотников, монитор '
       'с антибликовым покрытием и частотой обновления не менее 60 Гц.')

    # -------------------------------------------------------------------------
    hP(doc, '4.2', 'Расчёт искусственного освещения в помещении')
    pp(doc,
       'Расчёт искусственного освещения выполняется методом коэффициента '
       'использования светового потока. Рассматриваемое помещение – '
       'офис разработчика площадью 18 м² с размерами 6 м × 3 м '
       'и высотой потолка 3 м. Помещение оснащено белыми потолком '
       '(коэффициент отражения ρ_п = 0,7) и светлыми стенами '
       '(ρ_с = 0,5), цвет рабочей поверхности – серый (ρ_р = 0,3).')
    pp(doc,
       'Согласно СП 52.13330.2016 для зрительной работы высокой точности '
       '(работа с монитором) нормируемая освещённость составляет '
       'E_н = 400 лк. Высота подвеса светильников над рабочей '
       'поверхностью принимается h_р = 2,1 м (3,0 м потолка − 0,8 м '
       'высота стола − 0,1 м свес светильника).')

    pp(doc, 'Индекс помещения рассчитывается по формуле (4.1):')
    formula = doc.add_paragraph()
    fp(formula, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(6), sa=Pt(6))
    rf(formula.add_run('i = (A · B) / (h_р · (A + B)) = (6 · 3) / (2,1 · (6 + 3)) ≈ 0,95     (4.1)'))
    pp(doc, 'где A – длина помещения, м; B – ширина помещения, м; h_р – высота подвеса светильника над рабочей поверхностью, м.')

    pp(doc,
       'По таблицам коэффициентов использования светового потока для '
       'светильников типа ARS / OPL (модульные светодиодные панели) '
       'при ρ_п = 0,7, ρ_с = 0,5, ρ_р = 0,3 и i = 0,95 коэффициент '
       'использования η = 0,52.')

    pp(doc, 'Коэффициент запаса (учитывает запылённость и снижение светового потока ламп со временем) K_з = 1,2 для помещений с малым выделением пыли. Коэффициент неравномерности освещённости z = 1,1.')

    pp(doc, 'Необходимый общий световой поток рассчитывается по формуле (4.2):')
    formula = doc.add_paragraph()
    fp(formula, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(6), sa=Pt(6))
    rf(formula.add_run('Φ = (E_н · S · K_з · z) / η = (400 · 18 · 1,2 · 1,1) / 0,52 ≈ 18 277 лм.     (4.2)'))
    pp(doc, 'где Φ – общий световой поток, лм; E_н – нормируемая освещённость, лк; S – площадь помещения, м²; K_з – коэффициент запаса; z – коэффициент неравномерности; η – коэффициент использования светового потока.')

    pp(doc,
       'Принимаем к установке светодиодные потолочные панели типа '
       'ARS/R 595×595×40 мм со световым потоком Φ_л = 3 600 лм каждая. '
       'Необходимое число светильников определяется по формуле (4.3):')
    formula = doc.add_paragraph()
    fp(formula, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(6), sa=Pt(6))
    rf(formula.add_run('N = Φ / Φ_л = 18 277 / 3 600 ≈ 5,08; принимаем N = 6.     (4.3)'))

    pp(doc,
       'Светильники располагаются равномерно в два ряда по три штуки '
       'с шагом 2,0 м. При выбранной конфигурации фактическая '
       'освещённость рабочей поверхности составит:')
    formula = doc.add_paragraph()
    fp(formula, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(6), sa=Pt(6))
    rf(formula.add_run('E_ф = (N · Φ_л · η) / (S · K_з · z) = (6 · 3 600 · 0,52) / (18 · 1,2 · 1,1) ≈ 472 лк.     (4.4)'))
    pp(doc,
       'Фактическая освещённость 472 лк удовлетворяет нормативу 400 лк '
       'с запасом 18 %. Допустимая неравномерность освещённости '
       'не превышена.')

    # -------------------------------------------------------------------------
    hP(doc, '4.3', 'Электробезопасность на предприятии')
    pp(doc,
       'Электрооборудование рабочего места программиста (системный блок, '
       'монитор, периферийные устройства, маршрутизатор, сетевой фильтр) '
       'питается от однофазной сети переменного тока напряжением 220 В '
       'и частотой 50 Гц. Согласно ПУЭ (Правила устройства электроустановок), '
       'офисные помещения с компьютерной техникой относятся к категории '
       '«помещения без повышенной опасности»: сухие, без токопроводящей '
       'пыли, с изолирующими полами и температурой не выше 35 °C.')
    pp(doc,
       'Основные меры обеспечения электробезопасности на рабочем '
       'месте программиста:')
    li(doc, 'все электроприборы подключены через сетевой фильтр с защитой от импульсных перенапряжений и УЗО (устройство защитного отключения) с током срабатывания 30 мА')
    li(doc, 'розетки имеют защитный контакт (заземление) согласно ГОСТ 12.1.030-81; сопротивление заземления не превышает 4 Ом')
    li(doc, 'все токоведущие части электрооборудования закрыты корпусами и недоступны для случайного прикосновения')
    li(doc, 'визуальный осмотр кабелей и вилок проводится перед началом работы; повреждённые элементы немедленно заменяются')
    li(doc, 'запрещены оставление включённых приборов без присмотра, использование самодельных удлинителей, перегрузка сетевых фильтров одновременно несколькими мощными потребителями')
    li(doc, 'ремонт и обслуживание электрооборудования выполняется только квалифицированным персоналом с группой по электробезопасности не ниже III', last=True)
    pp(doc,
       'Согласно ГОСТ 12.1.038-82 предельно допустимое напряжение '
       'прикосновения для нормального режима работы составляет 2 В при '
       'продолжительности воздействия не более 10 минут; '
       'предельно допустимая сила тока – 0,3 мА. Эти значения '
       'обеспечиваются конструкцией оборудования (двойная изоляция класса II) '
       'и наличием защитного заземления.')
    pp(doc,
       'В рамках инструктажа по охране труда работник проходит первичный '
       'инструктаж на рабочем месте, повторный (раз в полугодие), '
       'внеплановый при изменении технологического процесса и '
       'целевой – при выполнении разовых работ. Все инструктажи фиксируются '
       'в журнале учёта согласно ГОСТ 12.0.004-2015.')

    # -------------------------------------------------------------------------
    hP(doc, '4.4', 'Пожарная безопасность на предприятии')
    pp(doc,
       'Согласно НПБ 105-03 (Нормы пожарной безопасности «Определение '
       'категорий помещений, зданий и наружных установок по взрывопожарной '
       'и пожарной опасности») офисные помещения с компьютерной техникой '
       'относятся к категории В4 (пожароопасные помещения с минимальной '
       'удельной пожарной нагрузкой 1–180 МДж/м²). Основными горючими '
       'материалами в офисе являются изоляция кабелей, корпуса '
       'компьютерной техники, мебель, бумажная документация.')
    pp(doc,
       'Основные причины возникновения пожара на рабочем месте программиста:')
    li(doc, 'короткое замыкание в электропроводке или электрооборудовании')
    li(doc, 'перегрузка сетевых фильтров и удлинителей')
    li(doc, 'неисправность блоков питания компьютеров')
    li(doc, 'нарушение правил эксплуатации обогревательных приборов')
    li(doc, 'неосторожное обращение с открытым огнём (курение в неположенных местах)', last=True)
    pp(doc,
       'Меры обеспечения пожарной безопасности приведены в таблице 4.2.')

    thdr(doc, '4.2', 'Меры обеспечения пожарной безопасности офисного помещения')
    mktable(doc,
        ['Мера', 'Реализация', 'Нормативный документ'],
        [
            ['Первичные средства пожаротушения', 'Огнетушитель ОУ-3 (углекислотный) — 1 шт. на 50 м², огнетушитель ОП-4 (порошковый) — 1 шт.', 'СП 9.13130.2009'],
            ['Автоматическая пожарная сигнализация', 'Дымовые извещатели ИП 212-45 — не реже 1 на 25 м²', 'СП 5.13130.2009'],
            ['Система оповещения о пожаре', 'Звуковые оповещатели СОУЭ 2 типа', 'СП 3.13130.2009'],
            ['Эвакуационные выходы', 'Двери открываются по ходу эвакуации; ширина проходов ≥ 1,2 м; план эвакуации на каждом этаже', 'СП 1.13130.2020'],
            ['Аварийное освещение', 'Светильники аварийного освещения над эвакуационными выходами', 'СП 52.13330.2016'],
            ['Запрет курения', 'Знаки «Курение запрещено» (Р-01) в местах с пожарной нагрузкой', 'ФЗ-15 «Об охране здоровья граждан»'],
            ['Инструктаж по пожарной безопасности', 'Вводный, первичный на рабочем месте, повторный (раз в 12 мес.), внеплановый', 'Правила противопожарного режима в РФ № 1479'],
            ['Журналы учёта', 'Журнал инструктажей, журнал учёта первичных средств пожаротушения', 'НПБ 105-03'],
        ]
    )
    pp(doc,
       'Для тушения возгораний в электроустановках под напряжением '
       'до 1000 В используются углекислотные (ОУ-3, ОУ-5) или порошковые '
       '(ОП-4, ОП-5) огнетушители; запрещено использовать воду и пенные '
       'огнетушители. При обнаружении пожара работник обязан немедленно '
       'сообщить по телефону 101 (или 112), обесточить оборудование, '
       'приступить к тушению первичными средствами и эвакуироваться '
       'из помещения согласно плану эвакуации.')

    # =========================================================================
    # ЗАКЛЮЧЕНИЕ
    # =========================================================================
    hS(doc, 'ЗАКЛЮЧЕНИЕ')
    pp(doc,
       'Целью работы являлась разработка прототипа системы отслеживания '
       'лекарственных препаратов в цепочке поставок на основе технологии блокчейн. '
       'Цель работы достигнута.')
    pp(doc, 'В ходе работы выполнены следующие задачи:', sa=Pt(0))
    li_n(doc, 1,
         'проведён анализ предметной области: '
         'изучены требования GxP, российское законодательство об обращении лекарств '
         'и проблематика контрафакта; сформированы 13 функциональных требований')
    li_n(doc, 2,
         'проанализированы пять существующих решений; '
         'выявлено отсутствие открытых прототипов с consumer-верификацией и recall on-chain; '
         'обоснована целесообразность собственной разработки')
    li_n(doc, 3,
         'выбран технологический стек: Solidity 0.8.24, Spring Boot 3.3.2, '
         'React 18.3.1, PostgreSQL 16; '
         'каждый выбор обоснован таблицей сравнения альтернатив')
    li_n(doc, 4,
         'спроектированы архитектура системы, девять таблиц базы данных '
         'и комплект диаграмм: use case, ER (три уровня), '
         'карта навигации, диаграмма состояний, последовательности и компонентов')
    li_n(doc, 5,
         'разработан смарт-контракт SupplyChain.sol с механизмом anti-replay operationId, '
         'иерархией ролей OpenZeppelin AccessControl и append-only историей; '
         'реализован Spring Boot REST API с кастомным JWT HS256 и опциональным индексером событий; '
         'создан React SPA с role-based navigation и компонентом SupplyChainTimeline')
    li_n(doc, 6,
         'проведено тестирование: '
         '9 автоматических Hardhat-тестов контракта, '
         '55 ручных функциональных тест-кейсов по 9 областям; '
         'все результаты соответствуют ожидаемым', last=True)
    pp(doc,
       'В результате разработки создан функциональный прототип, '
       'демонстрирующий возможность применения Ethereum-блокчейна '
       'для защиты фармацевтической цепочки поставок от контрафакта. '
       'Ключевые нетривиальные решения: '
       'anti-replay на основе bytes32 operationId, '
       'кастомная реализация JWT без сторонних библиотек, '
       'разделение данных между on-chain (доверие) и off-chain (UX), '
       'независимая потребительская верификация напрямую через смарт-контракт.')
    pp(doc,
       'Перспективы дальнейшего развития системы: '
       'интеграция с системой «Честный ЗНАК» через API-шлюз; '
       'поддержка IPFS для хранения сертификатов качества с фиксацией хеша on-chain; '
       'реализация мобильного клиента для быстрого сканирования QR-кодов потребителем.')

    # =========================================================================
    # СПИСОК ИСТОЧНИКОВ
    # =========================================================================
    hS(doc, 'СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ')
    sources = [
        '1. Antonopoulos A.M., Wood G. Mastering Ethereum: Building Smart Contracts and DApps. '
        'Sebastopol: O\'Reilly Media, 2018. 416 c. '
        'URL: https://github.com/ethereumbook/ethereumbook (дата обращения: 01.05.2025).',
        '2. Solidity Documentation v0.8.24 [Электронный ресурс]. '
        'URL: https://docs.soliditylang.org/en/v0.8.24/ (дата обращения: 01.05.2025).',
        '3. OpenZeppelin Contracts 5.x Documentation [Электронный ресурс]. '
        'URL: https://docs.openzeppelin.com/contracts/5.x/ (дата обращения: 01.05.2025).',
        '4. Hardhat Documentation [Электронный ресурс]. '
        'URL: https://hardhat.org/docs (дата обращения: 01.05.2025).',
        '5. Spring Boot Reference Documentation. Version 3.3.2 [Электронный ресурс]. '
        'URL: https://docs.spring.io/spring-boot/docs/3.3.2/reference/html/ (дата обращения: 01.05.2025).',
        '6. Spring Security Reference Documentation [Электронный ресурс]. '
        'URL: https://docs.spring.io/spring-security/reference/ (дата обращения: 01.05.2025).',
        '7. Jones M., Bradley J., Sakimura N. RFC 7519: JSON Web Token (JWT). '
        'IETF, 2015. URL: https://www.rfc-editor.org/rfc/rfc7519 (дата обращения: 01.05.2025).',
        '8. PostgreSQL 16 Documentation [Электронный ресурс]. '
        'URL: https://www.postgresql.org/docs/16/ (дата обращения: 01.05.2025).',
        '9. React v18 Documentation [Электронный ресурс]. '
        'URL: https://react.dev/ (дата обращения: 01.05.2025).',
        '10. ethers.js v6 Documentation [Электронный ресурс]. '
        'URL: https://docs.ethers.org/v6/ (дата обращения: 01.05.2025).',
        '11. Федеральный закон от 12.04.2010 N 61-ФЗ «Об обращении лекарственных средств» '
        '[Электронный ресурс]. '
        'URL: https://www.consultant.ru/document/cons_doc_LAW_99350/ (дата обращения: 01.05.2025).',
        '12. Постановление Правительства РФ от 14.12.2018 N 1556 «Об утверждении Положения '
        'о системе мониторинга движения лекарственных препаратов» [Электронный ресурс]. '
        'URL: https://www.consultant.ru/document/cons_doc_LAW_313174/ (дата обращения: 01.05.2025).',
        '13. WHO Good Distribution Practices for Pharmaceutical Products. '
        'WHO Technical Report Series No. 957, Annex 5. Женева: WHO, 2010. '
        'URL: https://www.who.int/publications/m/item/WHO-TRS-957-annex-5 (дата обращения: 01.05.2025).',
        '14. Mackey T.K., Nayyar G. A review of existing and emerging digital technologies '
        'to combat the global trade in fake medicines // Expert Opinion on Drug Safety. '
        '2017. Vol. 16, N 5. P. 587-602.',
        '15. Toyoda K., Mathiopoulos P.T., Sasase I., Ohtsuki T. A Novel Blockchain-Based '
        'Product Ownership Management System for Anti-Counterfeiting in the Post Supply Chain // '
        'IEEE Access. 2017. Vol. 5. P. 17465-17477.',
        '16. Web3j Documentation [Электронный ресурс]. '
        'URL: https://docs.web3j.io/ (дата обращения: 01.05.2025).',
        '17. hh.ru. Зарплаты Java-разработчиков в России, 2025 [Электронный ресурс]. '
        'URL: https://hh.ru/article/24493 (дата обращения: 01.05.2025).',
        '18. Docker Documentation [Электронный ресурс]. '
        'URL: https://docs.docker.com/ (дата обращения: 01.05.2025).',
    ]
    for src in sources:
        pp(doc, src, fi=Cm(0), sb=Pt(0), sa=Pt(0))

    # =========================================================================
    # ПРИЛОЖЕНИЕ А: DDL
    # =========================================================================
    appx_hdr(doc, 'А', '(справочное) Данные для экономической части')
    pp(doc,
       'В приложении приведены сводные данные, использованные при расчётах '
       'в экономической части (раздел 3): нормативы фонда рабочего времени, '
       'структура заработной платы исполнителя, тарифы социальных отчислений, '
       'результат расчёта себестоимости и цены программного продукта.')

    thdr(doc, 'А.1', 'Нормативы расчёта заработной платы')
    mktable(doc,
        ['Показатель', 'Значение', 'Источник'],
        [
            ['Среднемесячный оклад middle full-stack разработчика, руб.', '220 000',  'Агрегаторы вакансий (hh.ru, Хабр Карьера), 2026 г.'],
            ['Норма рабочего времени, ч/мес',                              '168',      'Производственный календарь РФ (40-час. неделя)'],
            ['Часовая ставка исполнителя, руб./ч',                        '1 310',    'Расчёт по формуле (3.1)'],
            ['Тариф взносов в Социальный фонд России (СФР), %',            '30,0',    'ст. 425 НК РФ (объединённый тариф с 2023 г.)'],
            ['Норма прибыли разработчика (рентабельность), %',             '25,0',    'Типовой ориентир для заказной разработки ПО'],
            ['Ставка НДС, %',                                              '20,0',    'ст. 164 НК РФ (общая ставка)'],
            ['Срок полезного использования оборудования, лет',             '3',       'ОКОФ 330.28.23.23 (ПК и ноутбуки)'],
            ['Стоимость рабочей станции (ноутбук), руб.',                  '150 000', 'Среднерыночная цена 2026 г.'],
        ]
    )

    thdr(doc, 'А.2', 'Сводный расчёт затрат на разработку (раздел 3.3)')
    mktable(doc,
        ['Статья затрат', 'Расчёт', 'Сумма, руб.'],
        [
            ['Заработная плата исполнителя',           '370 ч · 1 310 руб./ч',                 '484 700'],
            ['Отчисления в социальные фонды',          '484 700 · 0,30',                       '145 410'],
            ['Амортизация оборудования',               '(150 000 / 3) · (2,3 / 12)',           '9 583'],
            ['Программное обеспечение (IDE, GitHub)',  '15 600 · (2,3/12) + 4 800 · (2,3/12)', '3 910'],
            ['Накладные расходы',                      '484 700 · 0,20',                       '96 940'],
            ['Резерв непредвиденных расходов',         '(сумма выше) · 0,03',                  '21 615'],
            ['Итого затраты на разработку, З_разр',    '',                                      '762 158'],
        ]
    )

    thdr(doc, 'А.3', 'Сводный расчёт затрат на внедрение (раздел 3.4)')
    mktable(doc,
        ['Операция', 'Трудоёмкость, ч', 'Стоимость, руб.'],
        [
            ['Деплой смарт-контракта',                            '8',  '10 480'],
            ['Установка и конфигурирование backend',              '12', '15 720'],
            ['Настройка индексатора блокчейн-событий',            '6',  '7 860'],
            ['Развёртывание frontend и nginx',                    '6',  '7 860'],
            ['Регистрация пользователей, назначение ролей',       '8',  '10 480'],
            ['Обучение пользователей',                            '8',  '10 480'],
            ['Сопровождение опытной эксплуатации',                '20', '26 200'],
            ['Итого затраты на внедрение, З_внедр',               '68', '89 080'],
        ]
    )

    thdr(doc, 'А.4', 'Калькуляция цены программного продукта (раздел 3.5)')
    mktable(doc,
        ['Показатель', 'Формула', 'Сумма, руб.'],
        [
            ['Полная себестоимость, C_полн',                'З_разр + З_внедр',         '851 238'],
            ['Плановая прибыль (25 %), П',                  'C_полн · 0,25',            '212 810'],
            ['Оптовая цена без НДС, Ц_опт',                 'C_полн + П',               '1 064 048'],
            ['НДС 20 %',                                    'Ц_опт · 0,20',             '212 810'],
            ['Цена для заказчика, Ц',                       'Ц_опт · 1,20',             '1 276 858'],
        ]
    )

    thdr(doc, 'А.5', 'Сравнение совокупной стоимости владения за 3 года')
    mktable(doc,
        ['Вариант', 'Год 1, руб.', 'Год 2, руб.', 'Год 3, руб.', 'Итого за 3 года, руб.'],
        [
            ['PharmaChain Trace (собственная)',     '1 276 858', '57 600',    '57 600',    '1 392 058'],
            ['SaaS-аналог (от 3 000 000 руб./год)', '3 000 000', '3 000 000', '3 000 000', '9 000 000'],
            ['Заказная разработка у подрядчика',    '2 500 000', '300 000',   '300 000',   '3 100 000'],
            ['Экономия по сравнению с SaaS',        '1 723 142', '2 942 400', '2 942 400', '7 607 942'],
        ]
    )
    pp(doc,
       'Срок окупаемости разработанного программного продукта по сравнению '
       'с подпиской на SaaS-аналог составляет менее пяти месяцев. '
       'В дальнейшем экономия достигает 2,9 млн рублей в год при отсутствии '
       'лицензионных платежей.')

    pp(doc,
       'Для полноты приложения ниже приводится также DDL-скрипт создания '
       'базы данных, на котором основаны расчёты ёмкости системы. '
       'Полный набор миграций (V1–V5) включён в Приложение Б.')
    lhdr(doc, 'А.6', 'DDL-скрипт baseline-схемы (V1__baseline_schema.sql)')
    lblock(doc,
'CREATE TABLE IF NOT EXISTS app_users (\n'
'    id BIGSERIAL PRIMARY KEY,\n'
'    name VARCHAR(255) NOT NULL,\n'
'    role VARCHAR(32) NOT NULL,\n'
'    wallet_address VARCHAR(42) NOT NULL UNIQUE,\n'
'    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n'
');\n'
'\n'
'CREATE TABLE IF NOT EXISTS organizations (\n'
'    id BIGSERIAL PRIMARY KEY,\n'
'    name VARCHAR(255) NOT NULL,\n'
'    role VARCHAR(32) NOT NULL,\n'
'    country VARCHAR(128) NOT NULL,\n'
'    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n'
');\n'
'\n'
'CREATE TABLE IF NOT EXISTS product_metadata (\n'
'    id BIGSERIAL PRIMARY KEY,\n'
'    blockchain_product_id BIGINT NOT NULL UNIQUE,\n'
'    batch_number VARCHAR(255) NOT NULL,\n'
'    expiration_date DATE NOT NULL,\n'
'    description VARCHAR(1000),\n'
'    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n'
');\n'
'\n'
'CREATE TABLE IF NOT EXISTS product_batch_metadata (\n'
'    id BIGSERIAL PRIMARY KEY,\n'
'    blockchain_batch_id BIGINT NOT NULL UNIQUE,\n'
'    batch_number VARCHAR(255) NOT NULL,\n'
'    production_date DATE NOT NULL,\n'
'    expiration_date DATE NOT NULL,\n'
'    temperature_log_hash VARCHAR(66),\n'
'    metadata_hash VARCHAR(66),\n'
'    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n'
');\n'
'\n'
'CREATE TABLE IF NOT EXISTS product_events (\n'
'    id BIGSERIAL PRIMARY KEY,\n'
'    blockchain_product_id BIGINT NOT NULL,\n'
'    blockchain_batch_id BIGINT,\n'
'    event_type VARCHAR(64) NOT NULL,\n'
'    transaction_hash VARCHAR(66) NOT NULL,\n'
'    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n'
');\n'
'\n'
'CREATE UNIQUE INDEX IF NOT EXISTS uq_product_events_dedup\n'
'    ON product_events\n'
'    (transaction_hash, event_type, blockchain_product_id);\n'
'\n'
'CREATE INDEX IF NOT EXISTS idx_product_events_product_id\n'
'    ON product_events (blockchain_product_id);\n'
'CREATE INDEX IF NOT EXISTS idx_product_events_batch_id\n'
'    ON product_events (blockchain_batch_id);\n'
'\n'
'CREATE TABLE IF NOT EXISTS audit_logs (\n'
'    id BIGSERIAL PRIMARY KEY,\n'
'    actor VARCHAR(255) NOT NULL,\n'
'    action VARCHAR(128) NOT NULL,\n'
'    target_type VARCHAR(64) NOT NULL,\n'
'    target_id VARCHAR(128) NOT NULL,\n'
'    details VARCHAR(1200),\n'
'    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n'
');\n'
'\n'
'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at\n'
'    ON audit_logs (created_at DESC);\n'
'\n'
'CREATE TABLE IF NOT EXISTS indexer_state (\n'
'    id BIGINT PRIMARY KEY,\n'
'    last_processed_block BIGINT NOT NULL\n'
');\n'
'\n'
'CREATE TABLE IF NOT EXISTS refresh_tokens (\n'
'    id BIGSERIAL PRIMARY KEY,\n'
'    token_hash VARCHAR(128) NOT NULL UNIQUE,\n'
'    wallet_address VARCHAR(42) NOT NULL,\n'
'    expires_at TIMESTAMPTZ NOT NULL,\n'
'    revoked BOOLEAN NOT NULL DEFAULT FALSE,\n'
'    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n'
');\n'
'\n'
'CREATE TABLE IF NOT EXISTS temperature_logs (\n'
'    id BIGSERIAL PRIMARY KEY,\n'
'    blockchain_batch_id BIGINT NOT NULL,\n'
'    log_hash VARCHAR(66) NOT NULL,\n'
'    recorded_by VARCHAR(42) NOT NULL,\n'
'    celsius_min DOUBLE PRECISION,\n'
'    celsius_max DOUBLE PRECISION,\n'
'    notes VARCHAR(1000),\n'
'    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n'
');\n'
'\n'
'CREATE TABLE IF NOT EXISTS blockchain_transactions (\n'
'    id BIGSERIAL PRIMARY KEY,\n'
'    transaction_hash VARCHAR(66) NOT NULL UNIQUE,\n'
'    operation_type VARCHAR(64) NOT NULL,\n'
'    actor_wallet VARCHAR(42),\n'
'    status VARCHAR(32) NOT NULL DEFAULT \'CONFIRMED\',\n'
'    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n'
');'
    )

    # =========================================================================
    # ПРИЛОЖЕНИЕ Б: ТЕСТ-КЕЙСЫ
    # =========================================================================
    appx_hdr(doc, 'Б', '(справочное) Исходный код — тест-кейсы и серверная часть')
    pp(doc,
       'В приложении приведены тест-кейсы ручного функционального тестирования '
       'системы PharmaChain Trace. '
       'Всего разработано 55 тест-кейсов по девяти функциональным областям: '
       'авторизация, создание партии, создание продукта, передача владения, '
       'управление статусами, отзыв партии, верификация, ролевой доступ (RBAC), '
       'REST API. Все тест-кейсы выполнены со статусом «Пройден».')

    # (title, precond, step_text, expected, postcond)
    tc_data = [
        # ── Авторизация (1–5) ──────────────────────────────────────────────
        ('Регистрация пользователя',
         'База данных пуста. Приложение запущено.',
         'Отправить POST /api/users с корректными wallet_address и role.',
         'HTTP 200. Запись добавлена в таблицу app_users.',
         'Пользователь зарегистрирован в системе.'),
        ('Повторная регистрация того же кошелька',
         'Пользователь с данным wallet_address уже существует в БД.',
         'Отправить POST /api/users с тем же wallet_address.',
         'HTTP 409. Возвращается сообщение об ошибке уникальности.',
         'Дублирующая запись не создана.'),
        ('Вход с корректным wallet',
         'Пользователь зарегистрирован в системе.',
         'Отправить POST /api/auth/login с корректным wallet_address.',
         'HTTP 200. Тело ответа содержит JWT access-токен.',
         'Токен сохранён, пользователь считается авторизованным.'),
        ('Вход с несуществующим wallet',
         'Данный wallet_address не зарегистрирован.',
         'Отправить POST /api/auth/login с неизвестным wallet_address.',
         'HTTP 401 или HTTP 404. Токен не выдаётся.',
         ''),
        ('Защищённый эндпоинт без JWT-токена',
         'Пользователь не аутентифицирован.',
         'Отправить POST /api/product-batch-metadata без заголовка Authorization.',
         'HTTP 401. JSON-ответ содержит поле "error".',
         ''),
        # ── Создание партии (6–10) ─────────────────────────────────────────
        ('Создание партии производителем',
         'Кошелёк имеет роль MANUFACTURER_ROLE.',
         'Вызвать createBatch(productionDate, expirationDate, tempHash, metaHash).',
         'Событие BatchCreated эмитировано. batchId > 0.',
         'Партия добавлена в маппинг _batches.'),
        ('Создание партии без нужной роли',
         'Кошелёк attacker не имеет MANUFACTURER_ROLE.',
         'Вызвать createBatch(...) от имени attacker.',
         'Транзакция отклонена: revert AccessControl.',
         ''),
        ('Дата истечения раньше даты производства',
         'Кошелёк с MANUFACTURER_ROLE.',
         'Вызвать createBatch(now, now − 1, hash, hash).',
         'revert "Expiration date must be after production date".',
         ''),
        ('Нулевой metadataHash',
         'Кошелёк с MANUFACTURER_ROLE.',
         'Вызвать createBatch(now, now + 86400, hash, bytes32(0)).',
         'revert "Metadata hash is required".',
         ''),
        ('Поле recalled = false при создании',
         'Кошелёк с MANUFACTURER_ROLE.',
         'Вызвать createBatch(...), затем getBatch(batchId).',
         'batch.recalled равно false.',
         ''),
        # ── Создание продукта (11–15) ──────────────────────────────────────
        ('Создание продукта в существующей партии',
         'Партия с batchId = 1 существует. Кошелёк с MANUFACTURER_ROLE.',
         'Вызвать createProduct(1, "Аспирин", "SN-001").',
         'Событие ProductCreated. product.status = Manufactured.',
         'Продукт добавлен в систему.'),
        ('Дублирование серийного номера',
         'Продукт с serial = "SN-001" уже существует.',
         'Вызвать createProduct(1, "Аспирин 2", "SN-001").',
         'revert "Serial number already exists".',
         ''),
        ('Добавление продукта в чужую партию',
         'Партия создана производителем A. Текущий кошелёк — производитель B.',
         'Вызвать createProduct(batchA, "Ибупрофен", "SN-002").',
         'revert "Only batch manufacturer can add products to this batch".',
         ''),
        ('Добавление продукта в отозванную партию',
         'Партия с batchId = 1 имеет recalled = true.',
         'Вызвать createProduct(1, "Таблетка", "SN-003").',
         'revert "Batch is recalled".',
         ''),
        ('Создание продукта без роли производителя',
         'Кошелёк не имеет MANUFACTURER_ROLE.',
         'Вызвать createProduct(1, "Препарат", "SN-X").',
         'revert AccessControl.',
         ''),
        # ── Передача владения (16–20) ──────────────────────────────────────
        ('Передача продукта дистрибьютору',
         'Продукт принадлежит производителю. Получатель имеет DISTRIBUTOR_ROLE.',
         'Вызвать transferProduct(productId, distributor, opId).',
         'Событие ProductTransferred. product.status = InTransit.',
         'Текущий владелец продукта изменён на дистрибьютора.'),
        ('Передача продукта потребителю (не supply actor)',
         'Продукт принадлежит производителю.',
         'Вызвать transferProduct(productId, consumer, opId).',
         'revert "New owner is not an authorized supply actor".',
         ''),
        ('Передача не текущим владельцем',
         'Продукт принадлежит производителю. Транзакция от дистрибьютора.',
         'Вызвать transferProduct от имени distributor.',
         'revert "Only current owner can transfer".',
         ''),
        ('Передача самому себе',
         'Кошелёк с MANUFACTURER_ROLE является владельцем продукта.',
         'Вызвать transferProduct(productId, manufacturer, opId).',
         'revert "New owner must be different from current owner".',
         ''),
        ('Передача уже проданного продукта',
         'Продукт имеет статус Sold.',
         'Вызвать transferProduct(productId, distributor, opId).',
         'revert "Sold product cannot be transferred".',
         ''),
        # ── Управление статусами (21–25) ───────────────────────────────────
        ('Аптека устанавливает статус Delivered',
         'Продукт принадлежит аптеке, статус = InTransit.',
         'Вызвать updateStatus(productId, Delivered, opId) от аптеки.',
         'product.status = Delivered.',
         ''),
        ('Установка Sold не аптекой',
         'Продукт у дистрибьютора, статус = Delivered.',
         'Вызвать updateStatus(productId, Sold, opId) от distributor.',
         'revert "Only pharmacy can mark product as sold".',
         ''),
        ('Sold без предварительного Delivered',
         'Продукт у аптеки, статус = InTransit.',
         'Вызвать updateStatus(productId, Sold, opId).',
         'revert "Product must be in Delivered status before sold".',
         ''),
        ('Изменение статуса уже проданного продукта',
         'Продукт имеет статус Sold.',
         'Вызвать updateStatus(productId, Delivered, opId).',
         'revert "Sold product status is final".',
         ''),
        ('Попытка установить статус Recalled через updateStatus',
         'Кошелёк с PHARMACY_ROLE.',
         'Вызвать updateStatus(productId, Recalled, opId).',
         'revert "Use recallBatch to recall a batch".',
         ''),
        # ── Отзыв партии (26–30) ───────────────────────────────────────────
        ('Отзыв партии регулятором',
         'Кошелёк с REGULATOR_ROLE. Партия содержит 2 продукта.',
         'Вызвать recallBatch(batchId, "Загрязнение", opId).',
         'Событие BatchRecalled. Оба продукта: blocked = true.',
         'Партия и все её продукты заблокированы.'),
        ('Отзыв партии без роли регулятора',
         'Кошелёк с DISTRIBUTOR_ROLE.',
         'Вызвать recallBatch(batchId, reason, opId).',
         'revert AccessControl.',
         ''),
        ('Повторный отзыв уже отозванной партии',
         'Партия уже recalled = true.',
         'Вызвать recallBatch(batchId, reason, opId2).',
         'revert "Batch already recalled".',
         ''),
        ('Восстановление партии (unrecall)',
         'Кошелёк с REGULATOR_ROLE. Партия recalled = true.',
         'Вызвать unrecallBatch(batchId, "Ошибочный отзыв", opId).',
         'Событие BatchUnrecalled. blocked = false для всех продуктов.',
         'Партия восстановлена, операции с продуктами снова доступны.'),
        ('Операции с заблокированным продуктом',
         'Продукт заблокирован вследствие recall.',
         'Вызвать transferProduct или updateStatus для заблокированного продукта.',
         'revert "Product is blocked due to batch recall".',
         ''),
        # ── Верификация (31–35) ────────────────────────────────────────────
        ('Верификация подлинного продукта',
         'Продукт существует, партия не отозвана, срок не истёк.',
         'Вызвать verifyProduct(productId).',
         'VerificationResult: authentic = true, recalled = false, expired = false.',
         ''),
        ('Верификация по серийному номеру',
         'Продукт с serialNumber = "SN-001" зарегистрирован.',
         'Вызвать verifyProductBySerial("SN-001").',
         'authentic = true. batchId совпадает с ожидаемым.',
         ''),
        ('Верификация отозванного продукта',
         'Партия recalled = true.',
         'Вызвать verifyProduct(productId).',
         'recalled = true, blocked = true.',
         ''),
        ('Верификация с истёкшим сроком годности',
         'expirationDate партии меньше текущего block.timestamp.',
         'Вызвать verifyProduct(productId).',
         'VerificationResult.expired = true.',
         ''),
        ('Верификация несуществующего серийного номера',
         'Продукт с данным serialNumber не зарегистрирован.',
         'Вызвать verifyProductBySerial("FAKE-0000").',
         'revert "Product does not exist".',
         ''),
        # ── RBAC (36–40) ───────────────────────────────────────────────────
        ('Производитель создаёт партию (позитивный RBAC)',
         'Кошелёк имеет MANUFACTURER_ROLE.',
         'Вызвать createBatch(...).',
         'emit BatchCreated. Транзакция успешна.',
         ''),
        ('Регулятор пытается создать партию',
         'Кошелёк имеет REGULATOR_ROLE, но не MANUFACTURER_ROLE.',
         'Вызвать createBatch(...).',
         'revert AccessControl.',
         ''),
        ('Дистрибьютор пытается отозвать партию',
         'Кошелёк имеет DISTRIBUTOR_ROLE.',
         'Вызвать recallBatch(...).',
         'revert AccessControl.',
         ''),
        ('Аптека продаёт продукт со статусом Delivered',
         'Кошелёк с PHARMACY_ROLE. Продукт: статус Delivered, владелец — аптека.',
         'Вызвать updateStatus(productId, Sold, opId).',
         'product.status = Sold.',
         'Продукт считается проданным.'),
        ('Производитель пытается пометить продукт как Sold',
         'Кошелёк с MANUFACTURER_ROLE.',
         'Вызвать updateStatus(productId, Sold, opId).',
         'revert "Only pharmacy can mark product as sold".',
         ''),
        # ── Anti-replay / История (41–45) ──────────────────────────────────
        ('Повторное использование operationId',
         'operationId уже применялся в предыдущей транзакции.',
         'Вызвать transferProduct(id, addr, usedOpId).',
         'revert "Operation id already used".',
         ''),
        ('Пустой operationId (bytes32(0))',
         'Любой авторизованный актор.',
         'Вызвать transferProduct(id, addr, bytes32(0)).',
         'revert "Operation id is required".',
         ''),
        ('История продукта после двух операций',
         'Продукт создан, затем передан дистрибьютору.',
         'Вызвать getProductHistory(productId).',
         'history.length = 2. Записи отсортированы по времени.',
         ''),
        ('Верификация отозванного через batch (статус не Recalled)',
         'batch.recalled = true. product.status = InTransit (не изменён).',
         'Вызвать verifyProduct(productId).',
         'recalled = true в VerificationResult.',
         ''),
        ('Recall блокирует все продукты партии',
         'Партия содержит 3 продукта с разными статусами.',
         'Вызвать recallBatch(batchId, reason, opId).',
         'Все 3 продукта: blocked = true.',
         ''),
        # ── REST API Backend (46–50) ───────────────────────────────────────
        ('POST /api/auth/login — успешный вход',
         'Пользователь с данным wallet_address зарегистрирован.',
         'Отправить POST /api/auth/login с корректным wallet_address.',
         'HTTP 200. Тело: {"token": "<jwt>"}.',
         ''),
        ('GET /api/analytics/summary',
         'Backend запущен, БД содержит данные.',
         'Отправить GET /api/analytics/summary без авторизации.',
         'HTTP 200. JSON с полями totalProducts, totalBatches, totalEvents.',
         ''),
        ('GET /api/audit-logs',
         'В таблице audit_logs есть хотя бы одна запись.',
         'Отправить GET /api/audit-logs.',
         'HTTP 200. Тело — JSON-массив объектов AuditLog.',
         ''),
        ('POST с защищённым эндпоинтом без токена',
         'Запрос отправляется без заголовка Authorization.',
         'Отправить POST /api/product-batch-metadata без токена.',
         'HTTP 401. Тело: {"error": "Unauthorized"}.',
         ''),
        ('Swagger UI доступен',
         'Backend запущен на порту 8080.',
         'Открыть GET /swagger-ui/index.html в браузере.',
         'HTTP 200. Страница Swagger UI отображается без ошибок.',
         ''),
        # ── Дополнительные (51–55) ─────────────────────────────────────────
        ('Аналитика с Bearer-токеном',
         'Пользователь авторизован как MANUFACTURER.',
         'Отправить GET /api/analytics/summary с заголовком Authorization: Bearer <token>.',
         'HTTP 200. Корректные числовые данные в ответе.',
         ''),
        ('GET /api/product-events',
         'Индексер записал события в таблицу product_events.',
         'Отправить GET /api/product-events.',
         'HTTP 200. JSON-массив объектов с полями transactionHash, eventType.',
         ''),
        ('POST метаданных партии с JWT',
         'Пользователь авторизован. Партия с указанным batchId существует.',
         'Отправить POST /api/product-batch-metadata с корректным телом и токеном.',
         'HTTP 200. Метаданные сохранены в таблице product_batch_metadata.',
         ''),
        ('SupplyChainTimeline отображает историю',
         'Продукт имеет не менее двух записей в productHistories.',
         'Открыть /verify?serial=SN-001 в браузере.',
         'Компонент SupplyChainTimeline показывает все этапы движения продукта.',
         ''),
        ('QR-код открывает страницу верификации',
         'Продукт с serialNumber зарегистрирован. QR сгенерирован.',
         'Отсканировать QR-код с упаковки продукта.',
         'Браузер открывает /verify?serial=<SN>. Результат верификации отображается.',
         'Потребитель может убедиться в подлинности без авторизации.'),
    ]

    for idx, (title, precond, step_text, expected, postcond) in enumerate(tc_data):
        n = idx + 1
        thdr(doc, f'Б.{n}', f'Тест кейс {n}')
        mk_tc_table(doc, n, title, precond,
                    [('1', step_text, expected, 'Пройден', '')],
                    postcond=postcond)

    # =========================================================================
    # ПРИЛОЖЕНИЕ В: ЛИСТИНГИ
    # =========================================================================
    appx_hdr(doc, 'В', '(справочное) Исходный код — смарт-контракт и клиентская часть')

    # В.1 — SupplyChain.sol (структуры, события, createBatch, transferProduct)
    lhdr(doc, 'В.1', 'Смарт-контракт SupplyChain.sol (структуры, события, ключевые функции)')
    lblock(doc,
'// SPDX-License-Identifier: MIT\n'
'pragma solidity ^0.8.24;\n'
'import "@openzeppelin/contracts/access/AccessControl.sol";\n'
'\n'
'contract SupplyChain is AccessControl {\n'
'    bytes32 public constant MANUFACTURER_ROLE =\n'
'        keccak256("MANUFACTURER_ROLE");\n'
'    bytes32 public constant DISTRIBUTOR_ROLE =\n'
'        keccak256("DISTRIBUTOR_ROLE");\n'
'    bytes32 public constant PHARMACY_ROLE =\n'
'        keccak256("PHARMACY_ROLE");\n'
'    bytes32 public constant REGULATOR_ROLE =\n'
'        keccak256("REGULATOR_ROLE");\n'
'\n'
'    enum Status {\n'
'        Manufactured, InTransit,\n'
'        Delivered, Sold, Recalled\n'
'    }\n'
'\n'
'    struct ProductBatch {\n'
'        uint256 batchId;\n'
'        address manufacturer;\n'
'        uint256 productionDate;\n'
'        uint256 expirationDate;\n'
'        bool recalled;\n'
'        bytes32 temperatureHash;\n'
'        bytes32 metadataHash;\n'
'        bool exists;\n'
'    }\n'
'\n'
'    struct Product {\n'
'        uint256 id;\n'
'        uint256 batchId;\n'
'        string name;\n'
'        string serialNumber;\n'
'        address manufacturer;\n'
'        address currentOwner;\n'
'        uint256 createdAt;\n'
'        Status status;\n'
'        bool blocked;\n'
'        bool exists;\n'
'    }\n'
'\n'
'    struct ProductHistory {\n'
'        uint256 timestamp;\n'
'        address actor;\n'
'        address previousOwner;\n'
'        address newOwner;\n'
'        Status status;\n'
'        string action;\n'
'        bytes32 operationId;\n'
'    }\n'
'\n'
'    uint256 private _batchCounter;\n'
'    uint256 private _productCounter;\n'
'    mapping(uint256 => ProductBatch)  private _batches;\n'
'    mapping(uint256 => Product)       private _products;\n'
'    mapping(string  => uint256)       private _serialIndex;\n'
'    mapping(bytes32 => bool)          private _usedOps;\n'
'    mapping(uint256 => ProductHistory[]) private _history;\n'
'\n'
'    event BatchCreated(\n'
'        uint256 indexed batchId,\n'
'        address indexed manufacturer,\n'
'        uint256 productionDate, uint256 expirationDate,\n'
'        bytes32 temperatureHash, bytes32 metadataHash);\n'
'    event ProductCreated(\n'
'        uint256 indexed productId, uint256 indexed batchId,\n'
'        string serialNumber, string name,\n'
'        address indexed manufacturer);\n'
'    event ProductTransferred(\n'
'        uint256 indexed productId,\n'
'        address indexed from, address indexed to,\n'
'        bytes32 operationId);\n'
'    event BatchRecalled(\n'
'        uint256 indexed batchId,\n'
'        address indexed regulator, string reason);\n'
'    event BatchUnrecalled(\n'
'        uint256 indexed batchId,\n'
'        address indexed regulator, string reason);\n'
'\n'
'    function createBatch(\n'
'        uint256 productionDate,\n'
'        uint256 expirationDate,\n'
'        bytes32 temperatureHash,\n'
'        bytes32 metadataHash\n'
'    ) external onlyRole(MANUFACTURER_ROLE)\n'
'      returns (uint256)\n'
'    {\n'
'        require(expirationDate > productionDate,\n'
'            "Expiration date must be after production date");\n'
'        require(metadataHash != bytes32(0),\n'
'            "Metadata hash is required");\n'
'        uint256 batchId = ++_batchCounter;\n'
'        _batches[batchId] = ProductBatch({\n'
'            batchId:         batchId,\n'
'            manufacturer:    msg.sender,\n'
'            productionDate:  productionDate,\n'
'            expirationDate:  expirationDate,\n'
'            recalled:        false,\n'
'            temperatureHash: temperatureHash,\n'
'            metadataHash:    metadataHash,\n'
'            exists:          true\n'
'        });\n'
'        emit BatchCreated(batchId, msg.sender,\n'
'            productionDate, expirationDate,\n'
'            temperatureHash, metadataHash);\n'
'        return batchId;\n'
'    }\n'
'\n'
'    function transferProduct(\n'
'        uint256 productId,\n'
'        address newOwner,\n'
'        bytes32 operationId\n'
'    ) external {\n'
'        _requireValidOp(operationId);\n'
'        Product storage p = _products[productId];\n'
'        require(p.exists, "Product does not exist");\n'
'        require(!p.blocked, "Product is blocked");\n'
'        require(p.currentOwner == msg.sender,\n'
'            "Only current owner can transfer");\n'
'        require(p.status != Status.Sold,\n'
'            "Sold product cannot be transferred");\n'
'        require(newOwner != msg.sender,\n'
'            "New owner must be different from current owner");\n'
'        require(\n'
'            hasRole(MANUFACTURER_ROLE, newOwner) ||\n'
'            hasRole(DISTRIBUTOR_ROLE,  newOwner) ||\n'
'            hasRole(PHARMACY_ROLE,     newOwner),\n'
'            "New owner is not an authorized supply actor");\n'
'        address prev = p.currentOwner;\n'
'        p.currentOwner = newOwner;\n'
'        p.status       = Status.InTransit;\n'
'        _history[productId].push(ProductHistory({\n'
'            timestamp:     block.timestamp,\n'
'            actor:         msg.sender,\n'
'            previousOwner: prev,\n'
'            newOwner:      newOwner,\n'
'            status:        Status.InTransit,\n'
'            action:        "transfer",\n'
'            operationId:   operationId\n'
'        }));\n'
'        _usedOps[operationId] = true;\n'
'        emit ProductTransferred(\n'
'            productId, prev, newOwner, operationId);\n'
'    }\n'
'\n'
'    function _requireValidOp(bytes32 opId) private {\n'
'        require(opId != bytes32(0),\n'
'            "Operation id is required");\n'
'        require(!_usedOps[opId],\n'
'            "Operation id already used");\n'
'    }\n'
'}'
    )

    # В.2 — JwtService.java
    lhdr(doc, 'В.2', 'Сервис JWT-токенов (JwtService.java) — полная реализация')
    _jwt = (
        '@Service\n'
        'public class JwtService {\n'
        '    private static final Charset UTF_8 =\n'
        '        StandardCharsets.UTF_8;\n'
        '    private final String secret;\n'
        '\n'
        '    public JwtService(\n'
        '            @Value("${app.jwt.secret}") String s) {\n'
        '        this.secret = s;\n'
        '    }\n'
        '\n'
        '    public record ParsedJwt(\n'
        '        String walletAddress, UserRole role) {}\n'
        '\n'
        '    public String createToken(\n'
        '            String wallet, UserRole role) {\n'
        '        return createToken(\n'
        '            wallet, role, Duration.ofHours(24));\n'
        '    }\n'
        '\n'
        '    public String createToken(String wallet,\n'
        '            UserRole role, Duration validity) {\n'
        '        String hdr = b64(\n'
        '            "{alg:HS256,typ:JWT}");\n'
        '        long now = Instant.now().getEpochSecond();\n'
        '        long exp = now + validity.getSeconds();\n'
        '        String payload = b64(String.format(\n'
        '            "{sub:%s,role:%s,iat:%d,exp:%d}",\n'
        '            wallet, role.name(), now, exp));\n'
        '        String unsigned = hdr + "." + payload;\n'
        '        return unsigned + "." + sign(unsigned);\n'
        '    }\n'
        '\n'
        '    public ParsedJwt parseToken(String token) {\n'
        '        String[] p = token.split("\\\\.");\n'
        '        if (p.length != 3)\n'
        '            throw new JwtException(\n'
        '                "Malformed JWT");\n'
        '        if (!sign(p[0]+"."+p[1]).equals(p[2]))\n'
        '            throw new JwtException(\n'
        '                "JWT signature invalid");\n'
        '        String json = new String(\n'
        '            Base64.getUrlDecoder()\n'
        '                  .decode(p[1]), UTF_8);\n'
        '        long exp = Long.parseLong(\n'
        '            extractField(json, "exp"));\n'
        '        if (Instant.now().getEpochSecond() > exp)\n'
        '            throw new JwtException(\n'
        '                "JWT has expired");\n'
        '        return new ParsedJwt(\n'
        '            extractField(json, "sub"),\n'
        '            UserRole.valueOf(\n'
        '                extractField(json, "role")));\n'
        '    }\n'
        '\n'
        '    private String b64(String v) {\n'
        '        return Base64.getUrlEncoder()\n'
        '            .withoutPadding()\n'
        '            .encodeToString(v.getBytes(UTF_8));\n'
        '    }\n'
        '\n'
        '    private String sign(String v) {\n'
        '        try {\n'
        '            Mac mac =\n'
        '                Mac.getInstance("HmacSHA256");\n'
        '            mac.init(new SecretKeySpec(\n'
        '                secret.getBytes(UTF_8),\n'
        '                "HmacSHA256"));\n'
        '            return Base64.getUrlEncoder()\n'
        '                .withoutPadding()\n'
        '                .encodeToString(\n'
        '                    mac.doFinal(\n'
        '                        v.getBytes(UTF_8)));\n'
        '        } catch (Exception e) {\n'
        '            throw new IllegalStateException(\n'
        '                "Cannot sign JWT", e);\n'
        '        }\n'
        '    }\n'
        '\n'
        '    private String extractField(\n'
        '            String json, String key) {\n'
        '        int s = json.indexOf(key) + key.length();\n'
        '        while (s < json.length() &&\n'
        '               (json.charAt(s) == \'"\' ||\n'
        '                json.charAt(s) == \':\'  ||\n'
        '                json.charAt(s) == \' \')) s++;\n'
        '        int e = json.indexOf(",", s);\n'
        '        if (e < 0) e = json.indexOf("}", s);\n'
        '        String v = json.substring(s, e).trim();\n'
        '        if (v.startsWith("\\\"")) v = v.substring(1);\n'
        '        if (v.endsWith("\\\""))\n'
        '            v = v.substring(0, v.length()-1);\n'
        '        return v;\n'
        '    }\n'
        '}'
    )
    lblock(doc, _jwt)

    # В.3 — SecurityConfig.java
    lhdr(doc, 'В.3', 'Конфигурация Spring Security (SecurityConfig.java)')
    lblock(doc,
'@Configuration\n'
'public class SecurityConfig {\n'
'    @Bean\n'
'    public SecurityFilterChain securityFilterChain(\n'
'            HttpSecurity http,\n'
'            JwtService jwtService,\n'
'            @Value("${app.security"\n'
'            + ".require-authentication-for-mutations:true}")\n'
'            boolean requireAuth) throws Exception {\n'
'        http.csrf(csrf -> csrf.disable());\n'
'        http.cors(Customizer.withDefaults());\n'
'        http.sessionManagement(s -> s\n'
'            .sessionCreationPolicy(STATELESS));\n'
'        http.addFilterBefore(\n'
'            new JwtAuthenticationFilter(jwtService),\n'
'            UsernamePasswordAuthenticationFilter.class);\n'
'        http.authorizeHttpRequests(auth -> {\n'
'            if (!requireAuth) {\n'
'                auth.anyRequest().permitAll();\n'
'                return;\n'
'            }\n'
'            auth.requestMatchers("/api/auth/**")\n'
'                    .permitAll()\n'
'                .requestMatchers(GET, "/api/**")\n'
'                    .permitAll()\n'
'                .requestMatchers(POST, "/api/users")\n'
'                    .permitAll()\n'
'                .requestMatchers(POST, "/api/**")\n'
'                    .authenticated()\n'
'                .anyRequest().permitAll();\n'
'        });\n'
'        return http.build();\n'
'    }\n'
'}'
    )

    # В.4 — App.tsx
    lhdr(doc, 'В.4', 'Маршрутизация React-приложения (App.tsx)')
    lblock(doc,
'import { Route, Routes } from "react-router-dom";\n'
'import { Layout } from "./components/Layout";\n'
'import DashboardPage from "./pages/DashboardPage";\n'
'import ManufacturerDashboardPage\n'
'    from "./pages/ManufacturerDashboardPage";\n'
'import VerifyProductPage\n'
'    from "./pages/VerifyProductPage";\n'
'// ... прочие импорты\n'
'\n'
'export default function App() {\n'
'  return (\n'
'    <Layout>\n'
'      <Routes>\n'
'        <Route path="/" element={<DashboardPage />} />\n'
'        <Route path="/login" element={<LoginPage />} />\n'
'        <Route path="/manufacturer"\n'
'               element={<ManufacturerDashboardPage />}/>\n'
'        <Route path="/distributor"\n'
'               element={<DistributorDashboardPage />}/>\n'
'        <Route path="/pharmacy"\n'
'               element={<PharmacyDashboardPage />} />\n'
'        <Route path="/register"\n'
'               element={<RegisterProductPage />} />\n'
'        <Route path="/transfer"\n'
'               element={<TransferProductPage />} />\n'
'        <Route path="/recall"\n'
'               element={<RecallPage />} />\n'
'        <Route path="/verify"\n'
'               element={<VerifyProductPage />} />\n'
'        <Route path="/analytics"\n'
'               element={<AnalyticsPage />} />\n'
'      </Routes>\n'
'    </Layout>\n'
'  );\n'
'}'
    )

    # В.5 — contract.ts (operationId + createBatch)
    lhdr(doc, 'В.5', 'Функции взаимодействия с контрактом (contract.ts, фрагмент)')
    lblock(doc,
'function operationId(label: string) {\n'
'  return solidityPackedKeccak256(\n'
'    ["string", "uint256"],\n'
'    [`${label}-${crypto.randomUUID()}`,\n'
'     Date.now()]\n'
'  );\n'
'}\n'
'\n'
'export async function createBatch(\n'
'  productionDate: number,\n'
'  expirationDate: number,\n'
'  temperatureLog: string,\n'
'  metadata: string\n'
') {\n'
'  await ensureExpectedChain();\n'
'  const contract =\n'
'    await getSupplyChainContract(true);\n'
'  const tx = await contract.createBatch(\n'
'    productionDate, expirationDate,\n'
'    temperatureHash(temperatureLog),\n'
'    metadataHash(metadata)\n'
'  );\n'
'  const receipt = await tx.wait();\n'
'  return {\n'
'    txHash: receipt.hash,\n'
'    batchId: parseBatchCreatedEvent(\n'
'               receipt)?.args?.batchId\n'
'             ?.toString() ?? ""\n'
'  };\n'
'}'
    )

    # В.6 — Hardhat-тесты смарт-контракта (SupplyChain.test.ts, фрагмент)
    lhdr(doc, 'В.6', 'Автоматические тесты смарт-контракта (SupplyChain.test.ts)')
    lblock(doc,
'import { ethers } from "hardhat";\n'
'import { expect } from "chai";\n'
'import type { SupplyChain } from\n'
'    "../typechain-types";\n'
'import type { HardhatEthersSigner } from\n'
'    "@nomicfoundation/hardhat-ethers/signers";\n'
'\n'
'describe("SupplyChain", () => {\n'
'  let sc: SupplyChain;\n'
'  let admin: HardhatEthersSigner;\n'
'  let manufacturer: HardhatEthersSigner;\n'
'  let distributor: HardhatEthersSigner;\n'
'  let pharmacy: HardhatEthersSigner;\n'
'  let regulator: HardhatEthersSigner;\n'
'\n'
'  beforeEach(async () => {\n'
'    [admin, manufacturer, distributor,\n'
'     pharmacy, regulator] =\n'
'      await ethers.getSigners();\n'
'    sc = await (await ethers\n'
'      .getContractFactory("SupplyChain"))\n'
'      .deploy();\n'
'    await sc.grantRole(\n'
'      await sc.MANUFACTURER_ROLE(),\n'
'      manufacturer.address);\n'
'    await sc.grantRole(\n'
'      await sc.DISTRIBUTOR_ROLE(),\n'
'      distributor.address);\n'
'    await sc.grantRole(\n'
'      await sc.PHARMACY_ROLE(),\n'
'      pharmacy.address);\n'
'    await sc.grantRole(\n'
'      await sc.REGULATOR_ROLE(),\n'
'      regulator.address);\n'
'  });\n'
'\n'
'  it("creates batch and product", async () => {\n'
'    const now = Math.floor(Date.now() / 1000);\n'
'    const h = ethers.keccak256(\n'
'                ethers.toUtf8Bytes("meta"));\n'
'    const bTx = await sc.connect(manufacturer)\n'
'      .createBatch(now, now + 86400, h, h);\n'
'    const bRc = await bTx.wait();\n'
'    const bEv = bRc!.logs\n'
'      .map(l => sc.interface.parseLog(\n'
'             l as never))\n'
'      .find(e => e?.name === "BatchCreated");\n'
'    expect(bEv?.args.batchId).to.equal(1n);\n'
'    const opId = ethers.randomBytes(32);\n'
'    await sc.connect(manufacturer)\n'
'      .createProduct(1n, "Аспирин", "SN-001");\n'
'    const p = await sc.getProductBySerial("SN-001");\n'
'    expect(p.serialNumber).to.equal("SN-001");\n'
'    expect(p.status).to.equal(0); // Manufactured\n'
'  });\n'
'\n'
'  it("rejects duplicate serial number", async () => {\n'
'    const now = Math.floor(Date.now() / 1000);\n'
'    const h = ethers.keccak256(\n'
'                ethers.toUtf8Bytes("meta"));\n'
'    await sc.connect(manufacturer)\n'
'      .createBatch(now, now + 86400, h, h);\n'
'    await sc.connect(manufacturer)\n'
'      .createProduct(1n, "Аспирин", "SN-001");\n'
'    await expect(\n'
'      sc.connect(manufacturer)\n'
'        .createProduct(1n, "Аспирин 2", "SN-001")\n'
'    ).to.be.revertedWith(\n'
'      "Serial number already exists");\n'
'  });\n'
'\n'
'  it("blocks product after recall", async () => {\n'
'    const now = Math.floor(Date.now() / 1000);\n'
'    const h = ethers.keccak256(\n'
'                ethers.toUtf8Bytes("meta"));\n'
'    await sc.connect(manufacturer)\n'
'      .createBatch(now, now + 86400, h, h);\n'
'    await sc.connect(manufacturer)\n'
'      .createProduct(1n, "Препарат", "SN-002");\n'
'    const opId = ethers.hexlify(\n'
'      ethers.randomBytes(32));\n'
'    await sc.connect(regulator)\n'
'      .recallBatch(1n, "Contamination", opId);\n'
'    const p = await sc.getProductBySerial(\n'
'      "SN-002");\n'
'    expect(p.blocked).to.be.true;\n'
'  });\n'
'});'
    )

    # В.7 — Компонент верификации продукта (VerifyProductPage.tsx, фрагмент)
    lhdr(doc, 'В.7',
         'Страница верификации продукта (VerifyProductPage.tsx, фрагмент)')
    lblock(doc,
'import { useState } from "react";\n'
'import { useSearchParams } from "react-router-dom";\n'
'import {\n'
'  verifyProductBySerial,\n'
'  getProductHistory\n'
'} from "../lib/contract";\n'
'import { SupplyChainTimeline }\n'
'  from "../components/SupplyChainTimeline";\n'
'import type { VerificationResult }\n'
'  from "../types/product";\n'
'\n'
'export default function VerifyProductPage() {\n'
'  const [params] = useSearchParams();\n'
'  const [serial, setSerial] = useState(\n'
'    params.get("serial") ?? "");\n'
'  const [result, setResult] =\n'
'    useState<VerificationResult | null>(null);\n'
'  const [history, setHistory] = useState(\n'
'    [] as Awaited<ReturnType<\n'
'      typeof getProductHistory>>);\n'
'  const [error, setError] = useState("");\n'
'\n'
'  const handleVerify = async () => {\n'
'    setError(""); setResult(null);\n'
'    try {\n'
'      const res =\n'
'        await verifyProductBySerial(serial);\n'
'      setResult(res);\n'
'      const pid =\n'
'        await getProductIdBySerial(serial);\n'
'      setHistory(\n'
'        await getProductHistory(\n'
'          pid.toString()));\n'
'    } catch (e: unknown) {\n'
'      setError(\n'
'        e instanceof Error\n'
'          ? e.message\n'
'          : "Ошибка верификации");\n'
'    }\n'
'  };\n'
'\n'
'  return (\n'
'    <div className="max-w-2xl mx-auto p-6">\n'
'      <h1 className="text-2xl font-bold mb-4">\n'
'        Верификация препарата\n'
'      </h1>\n'
'      <div className="flex gap-2 mb-6">\n'
'        <input\n'
'          value={serial}\n'
'          onChange={e => setSerial(e.target.value)}\n'
'          placeholder="Серийный номер / QR"\n'
'          className="flex-1 border rounded px-3 py-2"\n'
'        />\n'
'        <button onClick={handleVerify}\n'
'          className="bg-blue-600 text-white\n'
'                     px-4 py-2 rounded">\n'
'          Проверить\n'
'        </button>\n'
'      </div>\n'
'      {error && (\n'
'        <p className="text-red-600">{error}</p>\n'
'      )}\n'
'      {result && (\n'
'        <>\n'
'          <VerificationBadge result={result} />\n'
'          <SupplyChainTimeline\n'
'            history={history} />\n'
'        </>\n'
'      )}\n'
'    </div>\n'
'  );\n'
'}'
    )

    out = 'Диплом.docx'
    doc.save(out)
    print(f'Сохранён: {out}')
    print('После открытия в Word: Ctrl+A -> F9 -> обновить оглавление.')


if __name__ == '__main__':
    main()
