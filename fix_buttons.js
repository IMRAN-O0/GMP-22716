import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walk(dirPath, callback);
        } else if (dirPath.endsWith('.tsx')) {
            callback(dirPath);
        }
    });
}

walk('./src/pages', (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Regex to match: <button ... handleSubmit(e, 'approved') ... </button>
    const btnRegex = /(<button[^>]*onClick=\{\(?e\)?\s*=>\s*handleSubmit\(e,\s*'approved'\)\}[^>]*>[\s\S]*?<\/button>)/g;
    
    if (btnRegex.test(content)) {
        content = content.replace(btnRegex, "{user?.level <= 2 ? ($1) : (\n  <button type=\"button\" onClick={e => handleSubmit(e, user?.level === 3 ? 'pending_approval' : 'pending_review')} disabled={loading} className=\"flex-1 bg-sky-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-sky-700 transition-colors flex items-center justify-center\">\n    إرسال للمراجعة / الاعتماد\n  </button>\n)}");
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Fixed", filePath);
    }
});
