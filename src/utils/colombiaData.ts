export const colombiaData = {
  "Amazonas": ["Leticia", "Puerto Nariño"],
  "Antioquia": ["Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Rionegro", "Turbo", "Caucasia", "Sabaneta", "Copacabana", "Caldas", "La Estrella", "Marinilla", "Guarne", "Carmen de Viboral", "Santa Fe de Antioquia", "Andes", "Yarumal", "Santa Rosa de Osos", "Puerto Berrío", "Amagá", "Ciudad Bolívar", "Urrao", "Sonsón", "Jericó"],
  "Arauca": ["Arauca", "Arauquita", "Saravena", "Tame"],
  "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Baranoa", "Puerto Colombia", "Galapa", "Sabanagrande", "Santo Tomás", "Luruaco"],
  "Bogotá D.C.": ["Bogotá"],
  "Bolívar": ["Cartagena", "Magangué", "Turbaco", "El Carmen de Bolívar", "Arjona", "María La Baja", "San Juan Nepomuceno", "Mompós", "San Jacinto", "Villanueva"],
  "Boyacá": ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Puerto Boyacá", "Paipa", "Moniquirá", "Garagoa", "Villa de Leyva", "Samacá"],
  "Caldas": ["Manizales", "La Dorada", "Chinchiná", "Villamaría", "Riosucio", "Anserma", "Supía", "Salamina", "Neira", "Aguadas"],
  "Caquetá": ["Florencia", "San Vicente del Caguán", "Cartagena del Chairá", "Puerto Rico", "El Doncello"],
  "Casanare": ["Yopal", "Aguazul", "Paz de Ariporo", "Villanueva", "Tauramena", "Monterrey"],
  "Cauca": ["Popayán", "Santander de Quilichao", "El Tambo", "Patía", "Puerto Tejada", "Piendamó", "Corinto", "Miranda", "Silvia", "Bolívar"],
  "Cesar": ["Valledupar", "Aguachica", "Agustín Codazzi", "Bosconia", "El Copey", "San Alberto", "Curumaní", "La Jagua de Ibirico", "El Paso", "Pailitas"],
  "Chocó": ["Quibdó", "Istmina", "Tadó", "Condoto", "Riosucio", "Carmen del Darién", "Boajá", "Acandí", "Nuquí", "Bahía Solano"],
  "Córdoba": ["Montería", "Santa Cruz de Lorica", "Tierralta", "Cereté", "Sahagún", "Montelíbano", "Planeta Rica", "San Pelayo", "Pueblo Nuevo", "Ayapel"],
  "Cundinamarca": ["Soacha", "Fusagasugá", "Facatativá", "Zipaquirá", "Chía", "Girardot", "Mosquera", "Madrid", "Funza", "Cajicá", "Tocancipá", "Ubaté", "Villeta", "La Mesa", "Pacho"],
  "Guainía": ["Inírida"],
  "Guaviare": ["San José del Guaviare", "Calamar", "El Retorno"],
  "Huila": ["Neiva", "Pitalito", "Garzón", "La Plata", "Campoalegre", "San Agustín", "Algeciras", "Gigante", "Timaná", "Rivera"],
  "La Guajira": ["Riohacha", "Maicao", "Uribia", "San Juan del Cesar", "Fonseca", "Manaure", "Villanueva", "Albania", "Dibulla", "Hatonuevo", "Barrancas", "El Molino", "Distracción", "La Jagua del Pilar", "Urumita"],
  "Magdalena": ["Santa Marta", "Ciénaga", "Zona Bananera", "Fundación", "El Banco", "Plato", "Aracataca", "Pivijay", "Sitionuevo", "El Retén"],
  "Meta": ["Villavicencio", "Acacías", "Granada", "Puerto López", "Puerto Gaitán", "Cumaral", "San Martín", "Castilla la Nueva", "Fuente de Oro", "Lejanías"],
  "Nariño": ["Pasto", "Tumaco", "Ipiales", "Túquerres", "Samaniego", "La Unión", "El Charco", "Barbacoas", "San Pablo", "Buesaco"],
  "Norte de Santander": ["Cúcuta", "Ocaña", "Villa del Rosario", "Los Patios", "Pamplona", "Tibú", "El Zulia", "Ábrego", "Sardinata", "Toledo"],
  "Putumayo": ["Mocoa", "Puerto Asís", "Orito", "Valle del Guamuez", "Villagarzón", "Sibundoy", "San Francisco"],
  "Quindío": ["Armenia", "Calarcá", "Montenegro", "Quimbaya", "Circasia", "La Tebaida", "Filandia", "Salento", "Génova", "Pijao"],
  "Risaralda": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia", "Belén de Umbría", "Quinchía", "Marsella", "Santuario", "Apía", "Guática"],
  "San Andrés y Providencia": ["San Andrés", "Providencia"],
  "Santander": ["Bucaramanga", "Floridablanca", "Barrancabermeja", "Girón", "Piedecuesta", "San Gil", "Socorro", "Vélez", "Málaga", "Zapatoca", "Barichara", "Guadalupe"],
  "Sucre": ["Sincelejo", "Corozal", "San Marcos", "Tolú", "Sampués", "San Onofre", "Majagual", "Since", "Los Palmitos", "Ovejas"],
  "Tolima": ["Ibagué", "Espinal", "Melgar", "Chaparral", "Líbano", "Honda", "Mariquita", "Fresno", "Purificación", "Guamo"],
  "Valle del Cauca": ["Cali", "Buenaventura", "Palmira", "Tuluá", "Yumbo", "Cartago", "Jamundí", "Buga", "Zarzal", "Florida", "Pradera", "Sevilla", "Roldanillo", "Ginebra", "Dagua"],
  "Vaupés": ["Mitú", "Carurú", "Taraira"],
  "Vichada": ["Puerto Carreño", "La Primavera", "Santa Rosalía", "Cumaribo"]
};

export const getDepartments = () => Object.keys(colombiaData).sort();
export const getCitiesByDepartment = (department: string) => {
  return colombiaData[department as keyof typeof colombiaData]?.sort() || [];
};
