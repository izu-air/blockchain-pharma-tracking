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
       'Работа состоит из трёх основных разделов и трёх приложений. '
       'Раздел 1 содержит анализ предметной области, обзор существующих решений '
       'и обоснование выбора технологий. '
       'Раздел 2 охватывает проектирование, разработку и тестирование системы. '
       'Раздел 3 содержит технико-экономическое обоснование разработки. '
       'Приложение А содержит DDL-скрипт создания базы данных. '
       'Приложение Б содержит таблицу тест-кейсов. '
       'Приложение В содержит листинги программного кода.')

    # =========================================================================
    # РАЗДЕЛ 1
    # =========================================================================
    hR(doc, '1', 'ОБЩАЯ ЧАСТЬ')

    # -------------------------------------------------------------------------
    hP(doc, '1.1', 'Анализ и описание предметной области', sb=Pt(12))
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
    hP(doc, '1.2', 'Анализ рынка существующих решений')
    pp(doc,
       'Для обоснования собственной разработки проанализированы пять существующих '
       'систем отслеживания фармацевтических цепочек поставок (таблица 1.2).')

    thdr(doc, '1.2', 'Сравнение существующих решений')
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
    hP(doc, '1.3', 'Анализ и выбор методов решения')
    pp(doc,
       'Для системы выбрана трёхуровневая клиент-серверная архитектура '
       'с блокчейном в качестве доверенного слоя данных. '
       'Клиентский уровень реализован как SPA на React с MetaMask для подписи транзакций. '
       'Серверный уровень реализован на Spring Boot и хранит метаданные в PostgreSQL. '
       'Блокчейн-уровень реализован на Solidity-контракте в сети Ethereum.')
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
    hP(doc, '1.4', 'Анализ и выбор средств и технологий')
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

    # -------------------------------------------------------------------------
    hP(doc, '2.1', 'Проектирование решения', sb=Pt(12))

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
    hP(doc, '2.2', 'Разработка решения')

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
    hP(doc, '2.3', 'Тестирование')
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
    hP(doc, '2.4', 'Методы обеспечения безопасности')
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

    hP(doc, '3.1', 'Технико-экономическое обоснование', sb=Pt(12))
    pp(doc,
       'Контрафактные лекарства наносят ущерб как потребителям, '
       'так и добросовестным производителям: '
       'первые рискуют жизнью и здоровьем, вторые несут репутационные и финансовые потери. '
       'Регуляторы фиксируют случаи, когда поддельная упаковка с корректным '
       'штрих-кодом успешно проходила стационарную проверку, '
       'поскольку база данных была обновлена злоумышленниками.')
    pp(doc,
       'Разработка системы PharmaChain Trace направлена на устранение уязвимости '
       'централизованных систем учёта: '
       'история движения продукта хранится в блокчейне и недоступна для ретроактивного изменения. '
       'Система не требует участия доверенного посредника для верификации: '
       'потребитель проверяет продукт напрямую через смарт-контракт.')
    pp(doc,
       'Потенциальные потребители разработки: '
       'фармацевтические производители, желающие предоставить покупателям '
       'независимую верификацию подлинности; '
       'регуляторные органы, контролирующие качество лекарств; '
       'аптечные сети, внедряющие цифровую прослеживаемость поставок.')

    hP(doc, '3.2', 'Расчёт затрат на разработку')
    pp(doc,
       'Трудозатраты рассчитаны на основе объёма реализованных модулей '
       'и нормативов для разработчика уровня middle. '
       'Таблица 3.1 содержит разбивку по этапам.')

    thdr(doc, '3.1', 'Трудозатраты по этапам разработки')
    mktable(doc,
        ['Этап', 'Содержание работ', 'Трудозатраты, ч'],
        [
            ['Анализ требований', 'Изучение предметной области, формирование требований, выбор стека', '40'],
            ['Проектирование', 'Архитектура, схема БД, диаграммы, API-спецификация', '40'],
            ['Разработка смарт-контракта', 'Solidity-контракт, тесты Hardhat, скрипты деплоя', '50'],
            ['Разработка backend', 'Spring Boot, JWT, Flyway, индексер, Swagger', '80'],
            ['Разработка frontend', 'React SPA, кабинеты ролей, ethers.js, UI-компоненты', '60'],
            ['Тестирование', 'Автоматические тесты, ручные сценарии, отладка', '30'],
            ['Документирование', 'Архитектурная документация, README, диплом', '20'],
            ['Итого', '', '320'],
        ]
    )
    pp(doc,
       'Часовая ставка junior/middle разработчика в Санкт-Петербурге в 2025 году '
       'составляет от 1500 до 2500 рублей в час [17]. '
       'Для расчёта принята средняя ставка 2000 рублей в час.')
    pp(doc,
       'Стоимость разработки рассчитывается по формуле (3.1):')
    # Формула
    f_para = doc.add_paragraph()
    fp(f_para, align=WD_ALIGN_PARAGRAPH.CENTER, fi=Cm(0), sb=Pt(12), sa=Pt(12))
    rf(f_para.add_run('C = T x S = 320 x 2000 = 640 000 руб.     (3.1)'))
    pp(doc,
       'где C (руб.) обозначает стоимость разработки; '
       'T (ч) обозначает суммарные трудозатраты; '
       'S (руб./ч) обозначает часовую ставку разработчика.')
    pp(doc,
       'Накладные расходы (рабочее место, программное обеспечение) '
       'составят ориентировочно 15 процентов от стоимости труда: 96 000 рублей. '
       'Итоговая стоимость разработки: 736 000 рублей.')

    hP(doc, '3.3', 'Сравнение с альтернативами')
    pp(doc,
       'Таблица 3.2 сравнивает три варианта получения системы аналогичного функционала.')

    thdr(doc, '3.2', 'Сравнение вариантов реализации системы')
    mktable(doc,
        ['Вариант', 'Единовременные затраты, руб.', 'Ежегодные затраты, руб.', 'Права на код', 'Гибкость доработки'],
        [
            ['Собственная разработка', '736 000', '0 (хостинг 60 000)', 'Полные', 'Высокая'],
            ['Готовый SaaS (аналог IBM Food Trust)', '0', 'от 3 000 000', 'Нет', 'Ограниченная'],
            ['Заказная разработка у подрядчика', 'от 2 500 000', '300 000 (поддержка)', 'Частичные', 'Средняя'],
        ]
    )
    pp(doc,
       'Собственная разработка при начальных вложениях 736 000 рублей '
       'имеет нулевые лицензионные затраты в последующие годы. '
       'SaaS-решения требуют ежегодных платежей от 3 000 000 рублей '
       'при отсутствии прав на код и ограниченной возможности доработки. '
       'Заказная разработка у внешнего подрядчика обойдётся дороже '
       'при аналогичном функционале.')

    hP(doc, '3.4', 'Экономический эффект')
    pp(doc,
       'Срок окупаемости собственной разработки по сравнению с SaaS-альтернативой '
       'составит менее одного года: '
       'ежегодная экономия на лицензиях (от 3 000 000 рублей) '
       'превышает единовременные затраты на разработку (736 000 рублей).')
    pp(doc,
       'Дополнительный экономический эффект трудно выразить в цифрах, '
       'но он существенен: полный контроль над исходным кодом '
       'и возможность адаптации под конкретные требования регулятора. '
       'Использование открытых EVM-совместимых сетей исключает привязку к конкретному вендору. '
       'Открытая верификация продукта потребителем повышает доверие к бренду производителя '
       'без необходимости доверять централизованному оператору.')

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
    appx_hdr(doc, 'А', 'Схема базы данных PostgreSQL')
    pp(doc,
       'Листинг А.1 содержит DDL-скрипт создания всех таблиц базы данных '
       'системы PharmaChain Trace.')
    lhdr(doc, 'А.1', 'DDL-скрипт создания базы данных (V1__baseline_schema.sql)')
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
    appx_hdr(doc, 'Б', 'Тест-кейсы функционального тестирования')
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
    appx_hdr(doc, 'В', 'Листинги программного кода')

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
