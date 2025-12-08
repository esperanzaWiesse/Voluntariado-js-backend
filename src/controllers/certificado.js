import PDFDocument from 'pdfkit';
import pool from '../config/database.js';

export const descargarCertificadoGlobal = async (req, res) => {
    try {
        const { idUsuario } = req.params;

        // 1. Obtener datos del usuario
        const query = `
            SELECT 
                u.nombre,
                u.apPaterno,
                u.apMaterno,
                u.dni,
                SUM(au.horasRealizadas) AS totalHoras
            FROM Actividad_Usuario au
            INNER JOIN usuario u ON au.idUsuario = u.idUsuario
            INNER JOIN Actividad a ON au.idActividad = a.idActi
            INNER JOIN GrupoVoluntariado gv ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado
            WHERE au.idUsuario = ? 
              AND au.completado = 1
              AND a.activo = 1
              AND gv.activo = 1
            GROUP BY u.idUsuario
        `;

        const [rows] = await pool.query(query, [parseInt(idUsuario)]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado o sin actividades completadas.'
            });
        }

        const datos = rows[0];
        const totalHoras = parseFloat(datos.totalHoras);

        if (totalHoras <= 100) {
            return res.status(400).json({
                ok: false,
                msg: `El usuario solo tiene ${totalHoras} horas. Se requieren más de 100 horas.`
            });
        }

        // 2. Configurar PDF (Portrait A4)
        // El usuario pidió formato vertical
        const doc = new PDFDocument({
            layout: 'portrait',
            size: 'A4',
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        const filename = `certificado_global_${datos.dni}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // --- COLORES Y ESTILOS ---
        const colors = {
            bgStart: '#667eea',
            bgEnd: '#764ba2',
            primary: '#003d7a',
            textTitle: '#1a1a1a',
            textBody: '#333333',
            textGray: '#666666'
        };

        const width = doc.page.width;
        const height = doc.page.height;

        // --- FONDO (Gradiente) ---
        const grad = doc.linearGradient(0, 0, width, height);
        grad.stop(0, colors.bgStart)
            .stop(1, colors.bgEnd);

        doc.rect(0, 0, width, height).fill(grad);

        // --- TARJETA CENTRAL (Certificate Card) ---
        const margin = 40;
        const cardX = margin;
        const cardY = margin;
        const cardW = width - (margin * 2);
        const cardH = height - (margin * 2);

        // Sombra simulada
        doc.save();
        doc.rect(cardX + 10, cardY + 10, cardW, cardH)
            .fillOpacity(0.3)
            .fill('black');
        doc.restore();

        // Fondo de la tarjeta
        doc.roundedRect(cardX, cardY, cardW, cardH, 10)
            .fill('white');

        // Borde azul grueso
        doc.roundedRect(cardX, cardY, cardW, cardH, 10)
            .lineWidth(20)
            .stroke(colors.primary);

        // Decoración de fondo diagonal (pattern)
        doc.save();
        doc.roundedRect(cardX + 10, cardY + 10, cardW - 20, cardH - 20, 5).clip();

        doc.rotate(-15, { origin: [cardX, cardY] });
        doc.rect(cardX - 100, cardY + 100, 300, height * 2)
            .fillOpacity(0.05)
            .fill(colors.primary);
        doc.restore();

        // --- ESQUINAS DECORATIVAS ---
        const cornerSize = 50;

        doc.save();
        doc.strokeOpacity(0.2);
        doc.lineWidth(3);
        doc.strokeColor(colors.primary);

        // Ajustamos offsets para que queden bien dentro del borde grueso
        const inset = 40;

        // Top-Left
        const tlX = cardX + inset;
        const tlY = cardY + inset;
        doc.moveTo(tlX, tlY + cornerSize).lineTo(tlX, tlY).lineTo(tlX + cornerSize, tlY).stroke();

        // Top-Right
        const trX = cardX + cardW - inset;
        const trY = cardY + inset;
        doc.moveTo(trX - cornerSize, trY).lineTo(trX, trY).lineTo(trX, trY + cornerSize).stroke();

        // Bottom-Left
        const blX = cardX + inset;
        const blY = cardY + cardH - inset;
        doc.moveTo(blX, blY - cornerSize).lineTo(blX, blY).lineTo(blX + cornerSize, blY).stroke();

        // Bottom-Right
        const brX = cardX + cardW - inset;
        const brY = cardY + cardH - inset;
        doc.moveTo(brX - cornerSize, brY).lineTo(brX, brY).lineTo(brX, brY - cornerSize).stroke();
        doc.restore();


        // --- LOGO (Imagen PNG) ---
        const logoSize = 100; // Un poco más grande para la imagen
        const centerX = width / 2;
        const logoY = cardY + 70;

        try {
            // Asumimos que logo.png está en la raíz del proyecto
            // Si está en public, sería 'public/logo.png'
            doc.image('logo.png', centerX - (logoSize / 2), logoY, {
                width: logoSize,
                align: 'center',
                valign: 'center'
            });
        } catch (err) {
            console.error('Error cargando logo.png', err);
            // Fallback: texto o círculo si falla la imagen
            doc.circle(centerX, logoY + (logoSize / 2), 40).fill(colors.primary);
        }


        // --- TEXTOS ---
        // En vertical tenemos más altura disponible, podemos espaciar más
        let currentY = logoY + logoSize + 30;

        // Universidad
        doc.font('Helvetica-Bold').fontSize(22).fillColor(colors.primary)
            .text('Universidad Andina del Cusco', 0, currentY, { align: 'center', width: width });

        currentY += 60;

        // Título CERTIFICADO
        doc.font('Times-Roman').fontSize(40).fillColor(colors.textTitle) // Un poco más grande
            .text('CERTIFICADO', 0, currentY, {
                align: 'center',
                width: width,
                characterSpacing: 5
            });

        currentY += 50;

        // Subtítulo
        doc.font('Times-Italic').fontSize(20).fillColor(colors.textGray)
            .text('DE PARTICIPACIÓN', 0, currentY, { align: 'center', width: width });

        currentY += 60;

        // Introducción
        doc.font('Times-Roman').fontSize(16).fillColor(colors.textBody)
            .text('La Universidad Andina del Cusco otorga el presente certificado a:', 0, currentY, { align: 'center', width: width });

        currentY += 40;

        // NOMBRE DEL USUARIO
        const nombreCompleto = `${datos.nombre} ${datos.apPaterno} ${datos.apMaterno}`;
        doc.font('Times-BoldItalic').fontSize(36).fillColor(colors.primary)
            .text(nombreCompleto, 0, currentY, { align: 'center', width: width });

        // Línea debajo del nombre
        const nameWidth = doc.widthOfString(nombreCompleto);
        doc.lineWidth(2).strokeColor(colors.primary)
            .moveTo((width - nameWidth) / 2, currentY + 40)
            .lineTo((width + nameWidth) / 2, currentY + 40)
            .stroke();

        currentY += 80;

        // Descripción
        // En vertical el ancho es menor, damos más margen lateral
        const descMargin = 100; // Margen más estrecho respecto a la tarjeta
        doc.font('Times-Roman').fontSize(16).fillColor('#444')
            .text(`Por su distinguida participación cumpliendo más de ${Math.floor(totalHoras)} horas en los diferentes grupos de voluntariado y por dedicar su tiempo y esfuerzo a causas de interés general, sin buscar un beneficio económico, con el objetivo de ayudar a la comunidad, al medio ambiente o a colectivos específicos.`,
                descMargin, currentY, {
                align: 'center',
                width: width - (descMargin * 2),
                lineGap: 8
            });

        // La fecha y código van más abajo en vertical
        currentY += 120; // Espacio amplio

        // Fecha
        const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#333')
            .text(`Cusco, ${fecha}`, 0, currentY, { align: 'center', width: width });

        currentY += 30;

        // Código
        const codigoUnico = `GLOB-${new Date().getFullYear()}-${datos.dni}-${Math.floor(Math.random() * 10000)}`;
        doc.font('Courier').fontSize(10).fillColor('#666')
            .text(`Código de verificación: ${codigoUnico}`, 0, currentY, { align: 'center', width: width });

        // Espacio de "3 enter" después del código (aprox 60pt)
        currentY += 60;

        // --- FIRMAS ---
        // Posicionar firmas dinámicamente o fixed al fondo si hay espacio.
        // Usaremos currentY como base para asegurar que NO solapen el código, 
        // pero preferiblemente al fondo si hay mucho espacio.
        // Comprobamos si currentY sigue siendo menor que el footer ideal.

        const minSigY = height - 150;

        // Si el contenido empujó mucho hacia abajo, usamos currentY, sino usamos el footer fijo
        const sigY = (currentY > minSigY) ? currentY : minSigY;

        const sigWidth = 180;
        const gap = 50; // Menor gap porque el ancho es menor
        // Recalcular StartX para centrar el bloque de firmas
        const totalSigBlockW = (sigWidth * 2) + gap;
        const startX = (width - totalSigBlockW) / 2;

        doc.lineWidth(2).strokeColor(colors.primary);

        // Firma 1
        const sig1X = startX;
        doc.moveTo(sig1X, sigY).lineTo(sig1X + sigWidth, sigY).stroke();
        doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.primary)
            .text('Coordinador Académico', sig1X, sigY + 10, { width: sigWidth, align: 'center' });
        doc.font('Helvetica').fontSize(10).fillColor('#666')
            .text('Universidad Andina del Cusco', sig1X, sigY + 25, { width: sigWidth, align: 'center' });

        // Firma 2
        const sig2X = startX + sigWidth + gap;
        doc.moveTo(sig2X, sigY).lineTo(sig2X + sigWidth, sigY).stroke();
        doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.primary)
            .text('Director de Proyección Social', sig2X, sigY + 10, { width: sigWidth, align: 'center' });
        doc.font('Helvetica').fontSize(10).fillColor('#666')
            .text('Universidad Andina del Cusco', sig2X, sigY + 25, { width: sigWidth, align: 'center' });


        doc.end();

    } catch (error) {
        console.error('Error al generar certificado PDF:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al generar el certificado',
            error: error.message
        });
    }
};
