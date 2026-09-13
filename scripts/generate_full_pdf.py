#!/usr/bin/env python3
"""
Full HTML & PDF Generator for RepairGraph Project Report
Ensures 100% parity with RepairGraph_Project_Report.docx.
"""

import os
import subprocess

class HtmlParagraph:
    def __init__(self, doc, style='Normal', align='left'):
        self.doc = doc
        self.style = style
        self.align = align
        self.runs = []
        self.paragraph_format = self

    # dummy paragraph format attributes
    space_before = 0
    space_after = 0
    line_spacing = 1.15
    keep_with_next = False

    def add_run(self, text=""):
        run = HtmlRun(text)
        self.runs.append(run)
        return run

    def add_picture(self, path, width=None):
        self.doc.add_image(path)

    @property
    def text(self):
        return "".join(r.text for r in self.runs)

    @text.setter
    def text(self, val):
        self.runs = [HtmlRun(val)]

class HtmlRun:
    def __init__(self, text=""):
        self.text = text
        self.bold = False
        self.italic = False
        self.font = self
        self.name = 'Arial'
        self.size = 11
        self.color = self
        self.rgb = None

class HtmlCell:
    def __init__(self, doc):
        self.doc = doc
        self.paragraphs = [HtmlParagraph(doc)]
        self.width = None

class HtmlRow:
    def __init__(self, doc, cols):
        self.cells = [HtmlCell(doc) for _ in range(cols)]

class HtmlTable:
    def __init__(self, doc, rows, cols):
        self.doc = doc
        self.rows = [HtmlRow(doc, cols) for _ in range(rows)]
        self.alignment = None

    def cell(self, row, col):
        return self.rows[row].cells[col]

class HtmlDoc:
    def __init__(self):
        self.blocks = []
        self.current_section = None

    def add_paragraph(self, text="", style='Normal'):
        p = HtmlParagraph(self, style=style)
        if text:
            p.add_run(text)
        self.blocks.append(('p', p))
        return p

    def add_table(self, rows, cols):
        tbl = HtmlTable(self, rows, cols)
        self.blocks.append(('table', tbl))
        return tbl

    def add_page_break(self):
        self.blocks.append(('page_break', None))

    def add_image(self, path, caption=""):
        self.blocks.append(('image', (path, caption)))

def build_full_html():
    from report_data_frontmatter import build_frontmatter
    from report_data_part1 import build_part1
    from report_data_part2 import build_part2
    from report_data_part3 import build_part3
    from report_data_part4 import build_part4

    doc = HtmlDoc()

    def add_p(d, text="", bold_prefix=None, space_after=6, italic=False, align=None):
        p = d.add_paragraph()
        if bold_prefix:
            r = p.add_run(bold_prefix)
            r.bold = True
        if text:
            r = p.add_run(text)
            r.italic = italic
        return p

    def add_bullet(d, text, bold_prefix=None, space_after=4):
        p = d.add_paragraph(style='List Bullet')
        if bold_prefix:
            r = p.add_run(bold_prefix)
            r.bold = True
        p.add_run(text)
        return p

    def add_heading_1(d, text):
        p = d.add_paragraph(style='Heading 1')
        r = p.add_run(text)
        r.bold = True
        return p

    def add_heading_2(d, text):
        p = d.add_paragraph(style='Heading 2')
        r = p.add_run(text)
        r.bold = True
        return p

    def add_heading_3(d, text):
        p = d.add_paragraph(style='Heading 3')
        r = p.add_run(text)
        r.bold = True
        return p

    def add_figure_image(d, img_path, caption):
        d.blocks.append(('image', (img_path, caption)))

    def add_callout_box(d, text, title="NOTE"):
        d.blocks.append(('callout', (title, text)))

    def format_table(table, col_widths=None, align=None):
        pass

    print("Executing builder functions into HtmlDoc...")
    build_frontmatter(doc, add_p, add_heading_1, add_heading_2, format_table)
    build_part1(doc, add_p, add_bullet, add_heading_1, add_heading_2, add_heading_3, 
                add_figure_image, add_callout_box, format_table)
    build_part2(doc, add_p, add_bullet, add_heading_1, add_heading_2, add_heading_3, 
                add_figure_image, add_callout_box, format_table)
    build_part3(doc, add_p, add_bullet, add_heading_1, add_heading_2, add_heading_3, 
                add_figure_image, add_callout_box, format_table)
    build_part4(doc, add_p, add_bullet, add_heading_1, add_heading_2, add_heading_3, 
                add_figure_image, add_callout_box, format_table)

    print(f"Total blocks rendered: {len(doc.blocks)}")

    # Convert blocks to HTML
    html_out = ["""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RepairGraph — Final Project Report</title>
<style>
  @page {
    size: A4;
    margin: 20mm 20mm 20mm 20mm;
    @top-right {
      content: "RepairGraph • 25BCE1112";
      font-family: Arial, sans-serif;
      font-size: 8pt;
      color: #94a3b8;
    }
    @bottom-right {
      content: "https://repairgraph.vercel.app | Page " counter(page);
      font-family: Arial, sans-serif;
      font-size: 8pt;
      color: #94a3b8;
    }
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1e293b;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }

  .cover-block {
    text-align: center;
    padding-top: 30px;
    margin-bottom: 30px;
  }
  .cover-inst {
    font-size: 11pt;
    font-weight: bold;
    color: #64748b;
    letter-spacing: 1px;
    margin-bottom: 20px;
  }
  .cover-title {
    font-family: Arial, sans-serif;
    font-size: 28pt;
    font-weight: bold;
    color: #0f172a;
    letter-spacing: 2px;
    margin-bottom: 10px;
  }
  .cover-sub {
    font-family: Arial, sans-serif;
    font-size: 13pt;
    font-weight: bold;
    color: #ea580c;
    margin-bottom: 35px;
    line-height: 1.4;
  }
  .cover-desc {
    font-size: 10.5pt;
    color: #334155;
    line-height: 1.6;
    margin-bottom: 40px;
  }

  .page-break {
    page-break-after: always;
  }

  h1 {
    font-family: Arial, sans-serif;
    font-size: 15pt;
    font-weight: bold;
    color: #0f172a;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 4px;
    margin-top: 24px;
    margin-bottom: 10px;
    page-break-after: avoid;
  }
  h2 {
    font-family: Arial, sans-serif;
    font-size: 12.5pt;
    font-weight: bold;
    color: #1e293b;
    margin-top: 18px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }
  h3 {
    font-family: Arial, sans-serif;
    font-size: 11pt;
    font-weight: bold;
    color: #334155;
    margin-top: 12px;
    margin-bottom: 4px;
    page-break-after: avoid;
  }

  p {
    margin-top: 0;
    margin-bottom: 8px;
    text-align: justify;
  }

  ul {
    margin-top: 2px;
    margin-bottom: 10px;
    padding-left: 22px;
  }
  li {
    margin-bottom: 4px;
    text-align: justify;
  }

  .callout {
    background-color: #fff7ed;
    border-left: 4px solid #ea580c;
    padding: 8px 12px;
    margin: 10px 0;
    font-size: 9.5pt;
    color: #431407;
  }
  .callout-title {
    font-weight: bold;
    color: #ea580c;
    margin-bottom: 2px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }
  th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: bold;
    text-align: left;
    padding: 5px 8px;
    border: 1px solid #cbd5e1;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  .figure-box {
    text-align: center;
    margin: 16px 0;
    page-break-inside: avoid;
  }
  .figure-box img {
    max-width: 95%;
    height: auto;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
  }
  .figure-cap {
    font-family: Arial, sans-serif;
    font-size: 9pt;
    font-weight: bold;
    font-style: italic;
    color: #475569;
    margin-top: 5px;
  }
</style>
</head>
<body>"""]

    is_first_cover = True
    in_ul = False

    for btype, bdata in doc.blocks:
        if btype != 'p' or (bdata.style != 'List Bullet'):
            if in_ul:
                html_out.append("</ul>")
                in_ul = False

        if btype == 'p':
            txt = ""
            for r in bdata.runs:
                chunk = r.text
                if r.bold and r.italic:
                    chunk = f"<strong><em>{chunk}</em></strong>"
                elif r.bold:
                    chunk = f"<strong>{chunk}</strong>"
                elif r.italic:
                    chunk = f"<em>{chunk}</em>"
                txt += chunk
            
            # Check style
            if bdata.style == 'Heading 1':
                html_out.append(f"<h1>{txt}</h1>")
            elif bdata.style == 'Heading 2':
                html_out.append(f"<h2>{txt}</h2>")
            elif bdata.style == 'Heading 3':
                html_out.append(f"<h3>{txt}</h3>")
            elif bdata.style == 'List Bullet':
                if not in_ul:
                    html_out.append("<ul>")
                    in_ul = True
                html_out.append(f"<li>{txt}</li>")
            else:
                if is_first_cover and "A CAPSTONE PROJECT REPORT" in txt:
                    html_out.append(f"<div class='cover-block'><div class='cover-inst'>{txt}</div>")
                elif is_first_cover and "REPAIRGRAPH" in txt:
                    html_out.append(f"<div class='cover-title'>{txt}</div>")
                elif is_first_cover and "AI-Assisted Device Repairability" in txt:
                    html_out.append(f"<div class='cover-sub'>{txt.replace(chr(10), '<br>')}</div>")
                elif is_first_cover and "Submitted in partial fulfillment" in txt:
                    html_out.append(f"<div class='cover-desc'>{txt.replace(chr(10), '<br>')}</div></div>")
                    is_first_cover = False
                else:
                    html_out.append(f"<p>{txt.replace(chr(10), '<br>')}</p>")

        elif btype == 'page_break':
            html_out.append("<div class='page-break'></div>")

        elif btype == 'table':
            tbl = bdata
            html_out.append("<table>")
            for r_idx, row in enumerate(tbl.rows):
                html_out.append("<tr>")
                for cell in row.cells:
                    cell_txt = "<br>".join(p.text for p in cell.paragraphs)
                    tag = "th" if r_idx == 0 else "td"
                    html_out.append(f"<{tag}>{cell_txt.replace(chr(10), '<br>')}</{tag}>")
                html_out.append("</tr>")
            html_out.append("</table>")

        elif btype == 'image':
            img_path, caption = bdata
            rel_path = os.path.relpath(img_path)
            html_out.append(f"<div class='figure-box'><img src='{rel_path}' alt='{caption}'><div class='figure-cap'>{caption}</div></div>")

        elif btype == 'callout':
            title, text = bdata
            html_out.append(f"<div class='callout'><div class='callout-title'>[{title}]</div>{text}</div>")

    if in_ul:
        html_out.append("</ul>")

    html_out.append("</body></html>")
    
    html_str = "\n".join(html_out)
    html_path = "RepairGraph_Project_Report.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_str)
    print(f"✓ Saved complete HTML report to: {html_path} ({len(html_str)} chars)")

    # Run Chrome Headless to generate PDF
    pdf_path = "RepairGraph_Project_Report.pdf"
    chrome_cmd = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={pdf_path}",
        os.path.abspath(html_path)
    ]
    print("Converting complete HTML to PDF via headless Google Chrome...")
    subprocess.run(chrome_cmd, check=True)
    if os.path.exists(pdf_path):
        print(f"✓ Successfully generated full PDF report: {pdf_path} ({os.path.getsize(pdf_path)} bytes)")

if __name__ == '__main__':
    build_full_html()
