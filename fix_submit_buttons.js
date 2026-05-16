import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walk(dirPath, callback);
        } else if (dirPath.endsWith('.tsx') && path.basename(dirPath).startsWith('Form')) {
            callback(dirPath);
        }
    });
}

walk('./src/pages', (filePath) => {
    if (filePath.includes('Viewer')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern for capturing everything inside the button <button type="submit" ...> ... </button>
    const regex1 = /(<button\s+type="submit"[^>]*>)([\s\S]*?)(<\/button>)/g;
    content = content.replace(regex1, (match, p1, p2, p3) => {
        if (p2.includes('إرسال للمراجعة / الاعتماد')) return match; // already handled
        if (p2.includes('اعتماد') || p2.includes('حفظ')) {
            modified = true;
            return `${p1}{user?.level <= 2 ? (<>${p2}</>) : 'إرسال للمراجعة / الاعتماد'}${p3}`;
        }
        return match;
    });

    const regex2 = /(<button[^>]*onClick=\{[^}]*handleSubmit[^}]*\}[^>]*>)([\s\S]*?)(<\/button>)/g;
    content = content.replace(regex2, (match, p1, p2, p3) => {
        if (p2.includes('إرسال للمراجعة / الاعتماد')) return match; // already handled
        if (p2.includes('اعتماد') || p2.includes('حفظ')) {
            modified = true;
            return `${p1}{user?.level <= 2 ? (<>${p2}</>) : 'إرسال للمراجعة / الاعتماد'}${p3}`;
        }
        return match;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Fixed submit buttons 2 in", filePath);
    }
});
