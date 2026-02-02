let myRadarChart = null;

// --- FONCTION DE FORMATAGE PROPRE (SANS /) ---
const formatCur = (num) => {
    // On force un espace standard pour éviter les caractères spéciaux dans le PDF
    return new Intl.NumberFormat('fr-FR').format(num).replace(/\s/g, ' ');
};

// --- OPTIONNEL : FORMATAGE DES INPUTS ---
// Cette fonction permet d'afficher le nombre formaté dans la console ou une aide
// Pour ton cas, on va l'appliquer au moment du calcul pour la clarté.

function calculate() {
    const getVal = (id) => Number(document.getElementById(id)?.value || 0);

    // 1. Inputs
    const price = getVal("price");
    const capexTotal = getVal("capexTotal");
    const yieldAcq = getVal("yieldAcq");
    const exitYield = getVal("exitYield");
    const irrTarget = getVal("irrTarget");
    const irrProject = getVal("irrProject");
    const duration = getVal("duration");
    const vacancy = getVal("vacancy");
    const capexESG = getVal("capexESG");
    const carbonTarget = getVal("carbonTarget");
    const regulatoryHorizon = getVal("regulatoryHorizon");
    const techComplexity = getVal("techComplexity");
    const opFeasibility = getVal("opFeasibility");

    // 2. LOGIQUE EXCEL
    let financeScore = (irrProject / irrTarget * 40) + ((yieldAcq / exitYield) * 40) - (vacancy * 2);
    financeScore = Math.min(100, Math.max(0, financeScore));

    let strandingBonus = (regulatoryHorizon > duration) ? 30 : 0;
    let esgScore = (carbonTarget / 50 * 40) + (capexESG / capexTotal * 30) + strandingBonus;
    esgScore = Math.min(100, Math.max(0, esgScore));

    let riskPenalty = (techComplexity * 4) + ((5 - opFeasibility) * 4);
    let globalScore = Math.max(0, ((financeScore + esgScore) / 2) - riskPenalty);

    // 3. AFFICHAGE TEXTE
    document.getElementById("financeScore").innerText = financeScore.toFixed(1) + "/100";
    document.getElementById("esgScore").innerText = esgScore.toFixed(1) + "/100";
    document.getElementById("riskScore").innerText = "-" + riskPenalty.toFixed(1);
    document.getElementById("globalScore").innerText = globalScore.toFixed(1) + "/100";

    const vElement = document.getElementById("verdict");
    if (globalScore >= 70) {
        vElement.innerText = "EXCELLENT : Projet robuste et pérenne.";
        vElement.style.color = "#166534";
    } else if (globalScore >= 50) {
        vElement.innerText = "ATTENTION : Viable uniquement si CAPEX maîtrisés.";
        vElement.style.color = "#854d0e";
    } else {
        vElement.innerText = "REFUS : Risque de Stranded Asset trop élevé.";
        vElement.style.color = "#991b1b";
    }

    // 4. MISE À JOUR DU GRAPHIQUE
    const ctx = document.getElementById('radarChart').getContext('2d');
    if (myRadarChart) { myRadarChart.destroy(); }

    myRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Finance', 'ESG', 'Risque Inversé'],
            datasets: [{
                data: [financeScore, esgScore, (100 - riskPenalty)],
                backgroundColor: 'rgba(22, 101, 52, 0.2)',
                borderColor: '#166534',
                pointBackgroundColor: '#166534',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true, // Garder le ratio carré
            aspectRatio: 1, // Force le carré
            scales: {
                r: { min: 0, max: 100, ticks: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const date = new Date().toLocaleDateString();

    // 1. Header Professionnel
    doc.setFillColor(22, 101, 52); // Vert foncé "Institutionnel"
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text("RAPPORT D'ANALYSE D'INVESTISSEMENT", 20, 22);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Date de l'analyse : ${date}`, 20, 35);

    // 2. Section Scores & Graphique
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("RÉSUMÉ DE LA PERFORMANCE", 20, 55);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Score Finance : ${document.getElementById("financeScore").innerText}`, 20, 65);
    doc.text(`Score ESG : ${document.getElementById("esgScore").innerText}`, 20, 72);
    doc.text(`Pénalité Risque : ${document.getElementById("riskScore").innerText}`, 20, 79);
    
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text(`SCORE GLOBAL : ${document.getElementById("globalScore").innerText}`, 20, 90);

    // Ajout du Graphique Radar
    const canvas = document.getElementById('radarChart');
    if (myRadarChart) {
        const imgData = canvas.toDataURL('image/png');
        // Positionné à droite des scores
        doc.addImage(imgData, 'PNG', 125, 45, 65, 65);
    }

    // 3. Détail des Hypothèses (Double Colonne)
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("DÉTAIL DES HYPOTHÈSES SAISIES", 20, 125);
    doc.setLineWidth(0.5);
    doc.setDrawColor(22, 101, 52);
    doc.line(20, 127, 190, 127);

    const col1 = 20;
    const col2 = 110;
    let yPos = 138;
    doc.setFontSize(9);

    // --- Colonne Finance ---
    doc.setFont(undefined, 'bold');
    doc.text("PILIER FINANCE", col1, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 7;

    const financeData = [
        ["Prix d'acquisition", formatCur(document.getElementById("price").value) + " €"],
        ["CAPEX Total", formatCur(document.getElementById("capexTotal").value) + " €"],
        ["Yield Acquisition", document.getElementById("yieldAcq").value + " %"],
        ["Exit Yield", document.getElementById("exitYield").value + " %"],
        ["TRI Cible", document.getElementById("irrTarget").value + " %"],
        ["TRI Projet", document.getElementById("irrProject").value + " %"],
        ["Durée Détention", document.getElementById("duration").value + " ans"],
        ["Taux de Vacance", document.getElementById("vacancy").value + " %"]
    ];

    financeData.forEach(item => {
        doc.text(item[0] + " :", col1, yPos);
        doc.text(item[1], col1 + 45, yPos);
        yPos += 6;
    });

    // --- Colonne ESG & Risques ---
    let yPos2 = 138;
    doc.setFont(undefined, 'bold');
    doc.text("PILIER ESG & TECHNIQUE", col2, yPos2);
    doc.setFont(undefined, 'normal');
    yPos2 += 7;

    const esgRiskData = [
        ["Dont CAPEX ESG", formatCur(document.getElementById("capexESG").value) + " €"],
        ["Réduction Carbone", document.getElementById("carbonTarget").value + " %"],
        ["Horizon Réglo.", document.getElementById("regulatoryHorizon").value + " ans"],
        ["Complexité Tech.", document.getElementById("techComplexity").value + " / 5"],
        ["Faisabilité Opé.", document.getElementById("opFeasibility").value + " / 5"]
    ];

    esgRiskData.forEach(item => {
        doc.text(item[0] + " :", col2, yPos2);
        doc.text(item[1], col2 + 45, yPos2);
        yPos2 += 6;
    });

    // 4. Bloc Verdict Visuel
    const verdictY = 210;
    const scoreVal = parseFloat(document.getElementById("globalScore").innerText);
    
    // Couleur dynamique du verdict
    if (scoreVal >= 70) doc.setFillColor(220, 252, 231); // Vert clair
    else if (scoreVal >= 50) doc.setFillColor(254, 249, 195); // Jaune clair
    else doc.setFillColor(254, 226, 226); // Rouge clair

    doc.rect(20, verdictY, 170, 35, 'F');
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("VERDICT STRATÉGIQUE", 25, verdictY + 10);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    const verdictText = document.getElementById("verdict").innerText;
    const splitVerdict = doc.splitTextToSize(verdictText, 160);
    doc.text(splitVerdict, 25, verdictY + 20);

    // 5. Footer & Disclaimer
    const footerY = 280;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    const disclaimer = "Avertissement : Ce rapport est issu d'une simulation pédagogique et ne constitue pas un conseil en investissement. L'exactitude des données saisies relève de la responsabilité de l'utilisateur. Tanguy Masini décline toute responsabilité quant aux décisions financières prises sur la base de ce modèle.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
    doc.text(splitDisclaimer, 20, footerY);
    
    doc.text(`Document généré via ESG Pre-Screening Tool - Tanguy Masini - Page 1/1`, 105, footerY + 10, { align: 'center' });

    // 6. Sauvegarde
    doc.save(`Rapport_Arbitrage_ESG_${date.replace(/\//g, '-')}.pdf`);
}