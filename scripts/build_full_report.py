#!/usr/bin/env python3
"""
RepairGraph — Final Academic Project Report Generator
Constructs:
  1. RepairGraph_Project_Report.docx (Fully formatted Word document)
  2. RepairGraph_Project_Report.pdf (Print-ready PDF via Chrome headless)
"""

import os
import sys
import subprocess
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

from report_data_frontmatter import build_frontmatter
from report_data_part1 import build_part1
from report_data_part2 import build_part2
from report_data_part3 import build_part3
from report_data_part4 import build_part4

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_page_number(run):
    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = 'PAGE'
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'separate')
    fldChar3 = OxmlElement('w:fldChar')
    fldChar3.set(qn('w:fldCharType'), 'end')

    r = run._r
    r.append(fldChar1)
    r.append(instrText)
    r.append(fldChar2)
    r.append(fldChar3)

def format_table(table, col_widths=None, align=WD_TABLE_ALIGNMENT.CENTER):
    table.alignment = align
    for i, row in enumerate(table.rows):
        trPr = row._tr.get_or_add_trPr()
        trPr.append(OxmlElement('w:cantSplit'))
        
        if i == 0:
            trPr.append(OxmlElement('w:tblHeader'))
            for cell in row.cells:
                set_cell_background(cell, 'F1F5F9')
                set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    for r in p.runs:
                        r.font.bold = True
                        r.font.name = 'Arial'
                        r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
                        r.font.size = Pt(9.5)
        else:
            bg = 'FFFFFF' if i % 2 != 0 else 'F8FAFC'
            for cell in row.cells:
                set_cell_background(cell, bg)
                set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    for r in p.runs:
                        r.font.name = 'Arial'
                        r.font.size = Pt(9)
                        r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

        if col_widths:
            for j, w in enumerate(col_widths):
                if j < len(row.cells):
                    row.cells[j].width = Inches(w)

def add_p(doc, text="", bold_prefix=None, space_after=6, italic=False, align=WD_ALIGN_PARAGRAPH.LEFT):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Arial'
        r_pre.font.bold = True
        r_pre.font.size = Pt(11)
        r_pre.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    if text:
        r = p.add_run(text)
        r.font.name = 'Arial'
        r.font.size = Pt(11)
        r.font.italic = italic
        r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    return p

def add_bullet(doc, text, bold_prefix=None, space_after=4):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Arial'
        r_pre.font.bold = True
        r_pre.font.size = Pt(10.5)
        r_pre.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(10.5)
    r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    return p

def add_heading_1(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(18)
    h.paragraph_format.space_after = Pt(8)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.name = 'Arial'
    r.font.bold = True
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    return h

def add_heading_2(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.name = 'Arial'
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    return h

def add_heading_3(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(10)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.name = 'Arial'
    r.font.bold = True
    r.font.size = Pt(11.5)
    r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    return h

def add_figure_image(doc, img_path, caption):
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run = p_img.add_run()
        run.add_picture(img_path, width=Inches(6.2))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(10)
        r_cap = p_cap.add_run(caption)
        r_cap.font.name = 'Arial'
        r_cap.font.bold = True
        r_cap.font.italic = True
        r_cap.font.size = Pt(9.5)
        r_cap.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

def add_callout_box(doc, text, title="NOTE"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, 'FFF7ED')
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    left = OxmlElement('w:left')
    left.set(qn('w:val'), 'single')
    left.set(qn('w:sz'), '24')
    left.set(qn('w:space'), '0')
    left.set(qn('w:color'), 'EA580C')
    tcBorders.append(left)
    for side in ['top', 'bottom', 'right']:
        node = OxmlElement(f'w:{side}')
        node.set(qn('w:val'), 'none')
        tcBorders.append(node)
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    r1 = p.add_run(f"[{title}] ")
    r1.font.name = 'Arial'
    r1.font.bold = True
    r1.font.size = Pt(9.5)
    r1.font.color.rgb = RGBColor(0xEA, 0x58, 0x0C)
    
    r2 = p.add_run(text)
    r2.font.name = 'Arial'
    r2.font.size = Pt(9.5)
    r2.font.color.rgb = RGBColor(0x43, 0x14, 0x07)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def build_docx_report():
    print("Initializing RepairGraph DOCX Project Report...")
    doc = docx.Document()

    # Set page margins to standard 1 inch
    section = doc.sections[0]
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)

    # Header & Footer setup
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hr = hp.add_run("RepairGraph — Academic Capstone Project Report | 25BCE1112")
    hr.font.name = 'Arial'
    hr.font.size = Pt(8.5)
    hr.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    fr1 = fp.add_run("RepairGraph • https://repairgraph.vercel.app | ")
    fr1.font.name = 'Arial'
    fr1.font.size = Pt(8.5)
    fr1.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
    add_page_number(fp.add_run())

    # Build sections
    print("Building Frontmatter & Preliminary Pages...")
    build_frontmatter(doc, add_p, add_heading_1, add_heading_2, format_table)

    print("Building Chapters 1 through 5...")
    build_part1(doc, add_p, add_bullet, add_heading_1, add_heading_2, add_heading_3, 
                add_figure_image, add_callout_box, format_table)

    print("Building Chapters 6 through 10...")
    build_part2(doc, add_p, add_bullet, add_heading_1, add_heading_2, add_heading_3, 
                add_figure_image, add_callout_box, format_table)

    print("Building Chapters 11 through 15...")
    build_part3(doc, add_p, add_bullet, add_heading_1, add_heading_2, add_heading_3, 
                add_figure_image, add_callout_box, format_table)

    print("Building Chapters 16 through 18, References, and Appendices...")
    build_part4(doc, add_p, add_bullet, add_heading_1, add_heading_2, add_heading_3, 
                add_figure_image, add_callout_box, format_table)

    output_path = "RepairGraph_Project_Report.docx"
    doc.save(output_path)
    print(f"✓ Saved DOCX report to: {output_path} ({os.path.getsize(output_path)} bytes)")
    return output_path

if __name__ == '__main__':
    # Ensure diagrams exist
    if not os.path.exists('docs/report_assets/figure1_architecture.png'):
        print("Generating figures first...")
        subprocess.run([sys.executable, 'scripts/generate_diagrams.py'], check=True)
    
    docx_file = build_docx_report()
    print("DOCX generation complete.")
