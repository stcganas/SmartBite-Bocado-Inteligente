import 'dotenv/config';
console.log("Keys in process.env:", Object.keys(process.env).filter(k => k.includes("DB") || k.includes("URL") || k.includes("KEY") || k.includes("POSTGRES")));
