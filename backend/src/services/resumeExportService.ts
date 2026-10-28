import PDFDocument from 'pdfkit';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import { ParsedResume } from '../types';

/**
 * Generates an ATS-friendly single-column PDF resume buffer.
 * Uses standard standard fonts, simple hierarchy, no complex columns or tables.
 */
export async function generatePdf(resume: ParsedResume): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: resume.fullName ? `${resume.fullName} - Resume` : 'Resume',
          Author: resume.fullName || 'CareerMatch AI User',
          Subject: 'ATS-Friendly Resume',
          Keywords: resume.skills.join(', '),
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Header: Full Name
      const name = resume.fullName || 'Candidate Resume';
      doc.font('Helvetica-Bold').fontSize(20).text(name, { align: 'center' });
      doc.moveDown(0.3);

      // Contact Info line
      const contactParts = [
        resume.email,
        resume.phone,
        resume.location,
      ].filter(Boolean);

      if (contactParts.length > 0) {
        doc.font('Helvetica').fontSize(10).fillColor('#4b5563').text(contactParts.join('  |  '), { align: 'center' });
        doc.moveDown(0.8);
      }

      doc.fillColor('#000000'); // Reset color

      // Divider line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#d1d5db').lineWidth(1).stroke();
      doc.moveDown(0.8);

      // Helper to add standard ATS section header
      const addSectionHeader = (title: string) => {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e40af').text(title.toUpperCase());
        doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        doc.moveDown(0.4);
        doc.fillColor('#000000');
      };

      // Summary
      if (resume.summary && resume.summary.trim()) {
        addSectionHeader('Professional Summary');
        doc.font('Helvetica').fontSize(10).lineGap(3).text(resume.summary.trim());
      }

      // Experience
      if (resume.experience && resume.experience.length > 0) {
        addSectionHeader('Work Experience');
        for (const exp of resume.experience) {
          doc.moveDown(0.4);
          // Job title and date line
          const title = exp.jobTitle || 'Role';
          const company = exp.company || '';
          const dates = [exp.startDate, exp.endDate || (exp.isCurrent ? 'Present' : '')].filter(Boolean).join(' - ');

          doc.font('Helvetica-Bold').fontSize(10.5).text(title, { continued: !!company });
          if (company) {
            doc.font('Helvetica').fontSize(10.5).text(` at ${company}`, { continued: !!dates });
          }
          if (dates) {
            doc.font('Helvetica-Oblique').fontSize(9.5).text(`  (${dates})`);
          } else {
            doc.text('');
          }

          if (exp.description && exp.description.trim()) {
            doc.font('Helvetica').fontSize(9.5).text(exp.description.trim());
            doc.moveDown(0.2);
          }

          // Bullet points
          if (exp.bullets && exp.bullets.length > 0) {
            for (const bullet of exp.bullets) {
              if (bullet && bullet.trim()) {
                doc.font('Helvetica').fontSize(9.5).text(`•  ${bullet.trim()}`, {
                  indent: 10,
                  lineGap: 2,
                });
              }
            }
          }
        }
      }

      // Skills
      if (resume.skills && resume.skills.length > 0) {
        addSectionHeader('Skills');
        doc.font('Helvetica').fontSize(9.5).lineGap(3).text(resume.skills.join('  •  '));
      }

      // Education
      if (resume.education && resume.education.length > 0) {
        addSectionHeader('Education');
        for (const edu of resume.education) {
          doc.moveDown(0.3);
          const deg = edu.degree || 'Degree';
          const inst = edu.institution || '';
          const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');

          doc.font('Helvetica-Bold').fontSize(10).text(deg, { continued: !!inst });
          if (inst) {
            doc.font('Helvetica').fontSize(10).text(`, ${inst}`, { continued: !!dates });
          }
          if (dates) {
            doc.font('Helvetica-Oblique').fontSize(9).text(`  (${dates})`);
          } else {
            doc.text('');
          }
        }
      }

      // Projects
      if (resume.projects && resume.projects.length > 0) {
        addSectionHeader('Projects');
        for (const proj of resume.projects) {
          doc.moveDown(0.3);
          doc.font('Helvetica-Bold').fontSize(10).text(proj.name || 'Project');
          if (proj.description) {
            doc.font('Helvetica').fontSize(9.5).text(proj.description);
          }
          if (proj.technologies && proj.technologies.length > 0) {
            doc.font('Helvetica-Oblique').fontSize(9).text(`Technologies: ${proj.technologies.join(', ')}`);
          }
        }
      }

      // Certifications
      if (resume.certifications && resume.certifications.length > 0) {
        addSectionHeader('Certifications');
        for (const cert of resume.certifications) {
          doc.font('Helvetica').fontSize(9.5).text(`•  ${cert}`, { indent: 10, lineGap: 2 });
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generates an ATS-friendly DOCX resume buffer.
 * Single-column layout with standard headings and paragraphs.
 */
export async function generateDocx(resume: ParsedResume): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Full Name Header
  children.push(
    new Paragraph({
      text: resume.fullName || 'Candidate Resume',
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 },
    })
  );

  // Contact Info
  const contactParts = [resume.email, resume.phone, resume.location].filter(Boolean);
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            color: '555555',
            size: 20, // 10pt
          }),
        ],
        spacing: { after: 240 },
      })
    );
  }

  // Summary
  if (resume.summary && resume.summary.trim()) {
    children.push(
      new Paragraph({
        text: 'PROFESSIONAL SUMMARY',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }),
      new Paragraph({
        text: resume.summary.trim(),
        spacing: { after: 200 },
      })
    );
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    children.push(
      new Paragraph({
        text: 'WORK EXPERIENCE',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      })
    );

    for (const exp of resume.experience) {
      const dates = [exp.startDate, exp.endDate || (exp.isCurrent ? 'Present' : '')].filter(Boolean).join(' - ');
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.jobTitle || 'Role', bold: true, size: 21 }),
            new TextRun({ text: exp.company ? ` - ${exp.company}` : '', size: 21 }),
            new TextRun({ text: dates ? `  (${dates})` : '', italics: true, size: 19 }),
          ],
          spacing: { before: 120, after: 60 },
        })
      );

      if (exp.description) {
        children.push(new Paragraph({ text: exp.description, spacing: { after: 60 } }));
      }

      for (const bullet of exp.bullets || []) {
        if (bullet && bullet.trim()) {
          children.push(
            new Paragraph({
              text: bullet.trim(),
              bullet: { level: 0 },
              spacing: { after: 40 },
            })
          );
        }
      }
    }
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    children.push(
      new Paragraph({
        text: 'SKILLS',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }),
      new Paragraph({
        text: resume.skills.join(', '),
        spacing: { after: 200 },
      })
    );
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    children.push(
      new Paragraph({
        text: 'EDUCATION',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      })
    );

    for (const edu of resume.education) {
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree || 'Degree', bold: true, size: 20 }),
            new TextRun({ text: edu.institution ? ` - ${edu.institution}` : '', size: 20 }),
            new TextRun({ text: dates ? ` (${dates})` : '', italics: true, size: 18 }),
          ],
          spacing: { after: 80 },
        })
      );
    }
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    children.push(
      new Paragraph({
        text: 'PROJECTS',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      })
    );

    for (const proj of resume.projects) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: proj.name || 'Project', bold: true, size: 20 }),
            new TextRun({ text: proj.technologies ? ` (${proj.technologies.join(', ')})` : '', italics: true, size: 18 }),
          ],
          spacing: { after: 40 },
        })
      );
      if (proj.description) {
        children.push(new Paragraph({ text: proj.description, spacing: { after: 80 } }));
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
