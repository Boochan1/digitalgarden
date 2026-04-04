export default async function handler(req, res) {
    const { code } = req.query;
    const url = `https://servers-frontend.fivem.net/api/servers/single/${code}`;

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const data = await response.json();
        
        // Allow your website to read this data (CORS Fix)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch from FiveM" });
    }
}
