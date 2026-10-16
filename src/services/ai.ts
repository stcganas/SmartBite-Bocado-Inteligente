import { Restaurant, Product, AppUser, Order, db } from "../store/db";
import { isRestaurantOpen } from "../utils/restaurantUtils";

export async function getSalesAssistantResponse(
  restaurant: Restaurant,
  chatHistory: { role: 'user' | 'model', parts: { text: string }[] }[],
  userMessage: string,
  onAddToCart: (product: Product) => void,
  userProfile?: AppUser,
  orderHistory?: Order[],
  cartItems?: { product: Product, quantity: number }[],
  favoriteProducts?: Product[]
): Promise<{ text: string, suggestedProducts?: Product[] }> {
  const isOpened = isRestaurantOpen(restaurant);

  // Cargar otros restaurantes y productos para escanear de forma cruzada
  let allRestaurants: Restaurant[] = [];
  let allProducts: any[] = [];
  try {
    allRestaurants = await db.getRestaurants();
    allProducts = await db.getAllProducts();
  } catch (error) {
    console.error("Error loading restaurants/products in getSalesAssistantResponse:", error);
  }

  const otherRestaurantsSummary = allRestaurants
    .filter(r => r.id !== restaurant.id)
    .map(r => {
      const menuForR = allProducts.filter(p => p.restaurantId === r.id);
      return {
        id: r.id,
        name: r.name,
        type: r.type,
        address: r.address || '',
        isOpen: isRestaurantOpen(r),
        menu: menuForR.map(p => ({
          id: p.id,
          name: p.name,
          desc: p.description,
          price: p.price,
          available: p.available
        }))
      };
    });

  const favoritesContext = favoriteProducts && favoriteProducts.length > 0
    ? `\nPLATOS FAVORITOS DEL CLIENTE:\n${favoriteProducts.map(p => `- ${p.name}`).join('\n')}`
    : '';

  const cartContext = cartItems && cartItems.length > 0 
    ? `\nCARRITO ACTUAL:\n${cartItems.map(i => `- ${i.quantity}x ${i.product.name} ($${i.product.price})`).join('\n')}\nSubtotal: $${cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)}`
    : '\nEL CARRITO ESTÁ VACÍO.';

  const aiKnowledge = restaurant.aiKnowledge;
  const knowledgeContext = aiKnowledge ? `
Información Adicional del Restaurante:
- Instrucciones de Comportamiento: ${aiKnowledge.instructions || 'N/A'}
- Horarios: ${aiKnowledge.openingHours || 'N/A'}
- Alérgenos: ${aiKnowledge.allergens || 'N/A'}
- Platos Estrella: ${aiKnowledge.popularDishes || 'N/A'}
- Horas Pico: ${aiKnowledge.peakHours || 'N/A'}
- Tipos de Comida/Especialidades: ${aiKnowledge.foodTypes || 'N/A'}
- Promociones Actuales: ${aiKnowledge.promotions || 'N/A'}
- Cupones: ${aiKnowledge.coupons || 'N/A'}
` : '';

  const userContext = userProfile ? `
Información del Cliente Actual:
- Nombre: ${userProfile.displayName || 'Usuario'}
- Email: ${userProfile.email}
- Teléfono: ${userProfile.phone || 'No proporcionado'}
- Historial de Pedidos Recientes: ${orderHistory && orderHistory.length > 0 
    ? orderHistory.slice(0, 3).map(o => `${o.createdAt}: ${o.items.map(i => i.product.name).join(', ')} ($${o.total})`).join(' | ') 
    : 'Sin pedidos previos todavía.'}
` : 'El cliente NO ha iniciado sesión actualmente.';

  const systemInstruction = `
======================================================================
SMARTBITE — SU BOCADO INTELIGENTE
ASISTENTE DE VENTAS CONVERSACIONAL — COMPORTAMIENTO NATURAL Y HUMANO
======================================================================

IDENTIDAD, ENERGÍA Y PERSONALIDAD:
Eres el asistente de ventas conversacional estrella de SmartBite, su Bocado Inteligente, atendiendo específicamente para el restaurante "${restaurant.name}" (${restaurant.type}).
Tu función es atender clientes, recomendar productos, resolver dudas, ayudar a elegir y acompañar al cliente hasta completar su pedido.
Tu personalidad debe sentirse:
- ¡SÚPER ENÉRGICA, DINÁMICA, ENTUSIASTA Y RADIANTE! Con vibra alta, chispa, calidez y mucha alegría.
- ¡RÁPIDA, ÁGIL Y DIRECTA AL GRANO! Respuestas vivaces, contundentes y cortas, sin rodeos ni lentitud.
- Espontánea, comercialmente brillante, apasionada por la comida y ultra atenta.
- La conversación debe sentirse como hablar con el mejor anfitrión del restaurante: veloz, súper alegre, carismático y eficiente.

1. REGLA PRINCIPAL: VELOCIDAD, ENERGÍA Y CONVERSACIÓN NATURAL
- Máxima agilidad: habla con ritmo alegre, dinámico y seguro. No te quedes divagando ni des discursos eternos.
- Entusiasmo contagioso: usa entonación positiva, viva y amigable.
- Evita frases mecánicas o lentas.
- En su lugar, responde con energía y dinamismo:
  "¡De una! ¿Qué se te antoja hoy? 🔥"
  "¡Uff, ese plato es espectacular! Mira..."
  "¡Listo, ya mismito te lo agrego!"
  "¡Queda genial! ¿Le sumamos una bebida bien fría para acompañarlo?"
- Si el cliente viene de prisa: ¡rapidísimo, al punto y sin fricción!

2. INTERRUPCIONES (BARGE-IN) Y PRIORIDAD DEL CLIENTE
- Prioridad absoluta: CLIENTE > SMARTBITE.
- Si el cliente interrumpe, cambia de tema o corrige un pedido:
  CALLAR → ESCUCHAR → ENTENDER → REACCIONAR → RESPONDER.
- No reinicies toda la respuesta ni repitas innecesariamente todo el pedido después de cada modificación.
- Descartar lo que quedó obsoleto y evitar dobles respuestas.
- Conserva siempre el contexto y la continuidad. Si dice "Mejor sin cebolla", comprende de inmediato a qué plato se refiere.

3. REACCIONES CONVERSACIONALES Y TIPOS DE INTERRUPCIÓN
- Expresiones contextuales: "Ah, sí...", "Mmm...", "Ahhh, ok...", "Sí, claro...", "Mmm, déjame mirar...", "A ver...", "Ok, déjame revisar...", "Claro...", "Perfecto.", "Uy, sí...", "Mmm, un segundo..."
- Casos específicos:
  A. Pregunta directa: "¿Cuánto cuesta?" -> "Ah, sí, claro. Cuesta..."
  B. Corrección: "No, mejor Sprite" -> "Ahhh, sí, claro. Te cambio por Sprite."
  C. Cambio de producto: "Mejor pollo" -> "Ah, perfecto. Cambiamos a pollo."
  D. Solicitud de espera: "Espera un momento" -> "Sí, claro." (detenerse inmediatamente).
  E. Información incompleta: "Yo quería..." -> "Mmm, sí... dime."
  F. Cambio de tema: "¿Hacen domicilios?" -> "Ah, claro. Sí hacemos domicilios..."

4. VOCALIZACIONES, PAUSAS Y TONO CONSULTIVO
- Vocalizaciones suaves: "Mmm...", "Ah...", "Ahhh...", breves y contextuales.
- Pausas breves para dar sensación de pensamiento genuino ("Mmm... déjame mirar... sí, ya lo veo").
- Vender conversando sin presionar. En vez de "¿Algo más?", utiliza: "¿Quieres que te recomiende algo para acompañarlo?".
- Recomienda productos disponibles en el menú real. NUNCA inventes productos, precios o ingredientes.

--- INFORMACIÓN Y CONFIGURACIÓN DEL RESTAURANTE ACTUAL ("${restaurant.name}") ---
- NOMBRE: ${restaurant.name}
- DIRECCIÓN/UBICACIÓN: ${restaurant.address || 'No especificada'}
- TELÉFONO: ${restaurant.phone || 'No especificado'}
- HORARIO GENERAL: ${restaurant.openingHours || 'No especificado'}
- HORARIOS DETALLADOS DEL LOCAL: ${restaurant.detailedHours ? JSON.stringify(restaurant.detailedHours) : 'No especificados'}
- ESTADO ACTUAL DE SERVICIO: ${isOpened ? 'ABIERTO (Servicio Activo)' : 'CERRADO (Sin servicio en este momento)'}

--- REGLAS DE NEGOCIO Y OPERACIÓN APROBADAS ---
1. REGLA DE NO MEZCLAR RESTAURANTES:
   - Prohibido combinar platos de diferentes restaurantes en un mismo pedido.
   - Si el cliente solicita platos de otro local, infórmale con amabilidad: "Para platos de un restaurante diferente, debes primero finalizar y pagar tu pedido actual de [Restaurante 1], y luego realizar tu pedido para [Restaurante 2]". Cada cocina despacha de manera independiente.
2. COMPORTAMIENTO ANTE RESTAURANTE CERRADO:
   - Reconoce la existencia del producto: confirma amablemente que el plato sí existe y es una de sus especialidades.
   - Comunica que el local está CERRADO en este momento, detallando horario de atención y dirección.
   - Ofrece proactivamente buscar alternativas en restaurantes de SmartBite, su Bocado Inteligente, que sí estén ABIERTOS ("isOpen: true").
3. PROTOCOLO DE BIENVENIDA Y BENEFICIOS:
   - Al iniciar la conversación, saluda con calidez y naturalidad:
     "¡Bienvenido a SmartBite, su Bocado Inteligente! La aplicación donde no solo podrás comer delicioso, sino también ganar dinero: gira la ruleta para ganar descuentos y productos gratis en compras participantes, gana dinero real por referir amigos, y acumula monedas de oro canjeables. ¿Qué se te antoja ordenar hoy?"
4. REGLA OBLIGATORIA DEL NOMBRE DEL DESTINATARIO PARA EL ENVÍO:
   - NUNCA uses la palabra 'usuario', 'cliente' ni 'invitado' en el pedido ni en 'customerName'.
   - Antes de llamar a 'finalizeOrder', DEBES PREGUNTAR EXPLÍCITAMENTE: "¿Para quién es el pedido?", "¿A nombre de quién va el pedido?" o "¿A quién va dirigido el pedido y cuál es tu nombre completo para la entrega?".
   - Guarda el nombre y apellido real de la persona para que el restaurante y repartidor sepan con total exactitud a quién entregarle y por quién preguntar.
5. GESTIÓN FLUIDA DE PEDIDOS COMO INVITADO:
   - Permite tomar pedidos en Modo Invitado de forma rápida y sin fricción (solicitando nombre real de entrega, teléfono, dirección, barrio y método de pago).
   - Tras enviar el pedido con 'confirmAndPlaceOrder', confírmale con alegría que su orden está en marcha y recuérdale amablemente registrarse tocando el botón dorado 'REGISTRARSE' en la parte inferior del chat para aprovechar todos los beneficios.
6. PERSONALIZACIÓN Y MARCA:
   - Si el usuario tiene sesión (${userProfile?.displayName || ''}), llámalo con calidez por su nombre real.
   - Siempre que menciones "SmartBite", añade ", su Bocado Inteligente".
7. CIERRE Y DISPONIBILIDAD:
   - Si un producto tiene "available: false", explica con cortesía que está temporalmente agotado y sugiere otra opción deliciosa.
   - Respuestas concisas, bien estructuradas y fáciles de leer en dispositivos móviles.
`;

  const addToCartDeclaration = {
    name: "addToCart",
    description: "Agrega un producto específico al carrito de compras del cliente.",
    parameters: {
      type: "OBJECT",
      properties: {
        productId: {
          type: "STRING",
          description: "El ID del producto a agregar (ej. 'p1', 'p2').",
        },
        quantity: {
          type: "NUMBER",
          description: "La cantidad del producto a agregar.",
        }
      },
      required: ["productId", "quantity"],
    },
  };

  const finalizeOrderDeclaration = {
    name: "finalizeOrder",
    description: "Genera el resumen final del pedido para enviarlo al restaurante. NUNCA uses 'usuario' ni nombres genéricos en 'customerName'. Debes preguntar antes: '¿Para quién es el pedido?' o '¿A nombre de quién va el pedido?' para que el repartidor y el local sepan exactamente a quién se le entrega y por quién van a preguntar.",
    parameters: {
      type: "OBJECT",
      properties: {
        customerName: { type: "STRING", description: "Nombre y apellido real del cliente destinatario del pedido. OBLIGATORIO preguntar a quién va dirigido el pedido. PROHIBIDO usar 'usuario' o 'invitado'." },
        deliveryAddress: { type: "STRING", description: "Dirección de entrega completa y detallada." },
        neighborhood: { type: "STRING", description: "Barrio o sector." },
        phoneNumber: { type: "STRING", description: "Número de teléfono de contacto para la entrega." },
        paymentMethod: { type: "STRING", description: "Método de pago (ej. Efectivo, Nequi, Daviplata, Tarjeta)." },
        notes: { type: "STRING", description: "Notas o instrucciones adicionales de entrega." }
      },
      required: ["customerName", "deliveryAddress", "neighborhood", "phoneNumber", "paymentMethod"],
    },
  };

  const confirmAndPlaceOrderDeclaration = {
    name: "confirmAndPlaceOrder",
    description: "Envía oficialmente el pedido al panel del restaurante después de la confirmación del usuario con su nombre real (nunca 'usuario').",
    parameters: {
      type: "OBJECT",
      properties: {
        customerName: { type: "STRING", description: "Nombre real del cliente destinatario. Nunca 'usuario'." },
        deliveryAddress: { type: "STRING" },
        neighborhood: { type: "STRING" },
        phoneNumber: { type: "STRING" },
        paymentMethod: { type: "STRING" },
        notes: { type: "STRING" }
      },
      required: ["customerName", "deliveryAddress", "neighborhood", "phoneNumber", "paymentMethod"],
    },
  };

  const showProductsDeclaration = {
    name: "showProducts",
    description: "Muestra visualmente una lista de productos al cliente mediante tarjetas en el chat. ÚSALO SIEMPRE cuando menciones o sugieras múltiples opciones de un mismo tipo (ej. varios sancochos, varias pizzas) o varias recomendaciones.",
    parameters: {
      type: "OBJECT",
      properties: {
        productIds: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Lista de IDs de productos a mostrar visualmente."
        },
        message: {
          type: "STRING",
          description: "Mensaje complementario para decirle al usuario sobre las opciones."
        }
      },
      required: ["productIds", "message"],
    },
  };

  const tools: any[] = [{ 
    functionDeclarations: [
      showProductsDeclaration, 
      addToCartDeclaration, 
      finalizeOrderDeclaration, 
      confirmAndPlaceOrderDeclaration
    ] 
  }];

  try {
    const chatHistoryModel = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: msg.parts
    }));

    const contents = [...chatHistoryModel, { role: 'user', parts: [{ text: userMessage }] }];

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          tools,
          temperature: 0.7,
        }
      })
    });

    if (!res.ok) throw new Error("Fallo al contactar con el asistente IA");
    
    const response = await res.json();
    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const functionCalls = response.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        if (call.name === "showProducts") {
          const args = call.args as any;
          const productIds = args.productIds || [];
          const products = restaurant.menu.filter(p => productIds.includes(p.id));
          return { text: args.message, suggestedProducts: products };
        } else if (call.name === "addToCart") {
          const args = call.args as any;
          const product = restaurant.menu.find(p => p.id === args.productId);
          if (product) {
            for(let i=0; i< (args.quantity || 1); i++) {
               onAddToCart(product);
            }
            return { text: `¡Excelente elección! He agregado ${args.quantity || 1}x ${product.name} a tu pedido. ¿Te gustaría algo más para acompañar?` };
          }
        } else if (call.name === "finalizeOrder") {
          const args = call.args as any;
          return { text: `He preparado un resumen de tu pedido para el envío:\n- Cliente: ${args.customerName}\n- Dirección: ${args.deliveryAddress} (${args.neighborhood})\n- Pago: ${args.paymentMethod}\n\n¿Deseas confirmar este pedido para enviarlo ahora mismo al panel del restaurante?` };
        } else if (call.name === "confirmAndPlaceOrder") {
          const args = call.args as any;
          
          if (cartItems && cartItems.length > 0) {
            try {
              const total = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
              const isGuest = !userProfile || userProfile.isGuest || userProfile.email?.includes('@smartbite.guest.com');

              let finalCustomerId = userProfile?.id;
              if (!finalCustomerId && args.customerName) {
                try {
                  const { user: guestUser } = await db.createGuestAccount(args.customerName, args.phoneNumber || '');
                  if (guestUser) {
                    finalCustomerId = guestUser.id;
                  }
                } catch (guestErr) {
                  console.warn("Could not create guest account for AI order:", guestErr);
                }
              }

              if (isGuest) {
                try {
                  localStorage.setItem('smartbite_is_guest', 'true');
                  sessionStorage.setItem('dismissed_profile_modal', 'true');
                } catch (e) {}
              }

              const { data: savedOrder } = await db.saveOrder({
                restaurantId: restaurant.id,
                customerId: finalCustomerId,
                customerType: isGuest ? 'guest' : 'registered',
                customerName: args.customerName,
                customerPhone: args.phoneNumber,
                items: cartItems.map(i => ({
                  product: i.product as any,
                  quantity: i.quantity
                })),
                total: total,
                status: 'pending',
                paymentMethod: (args.paymentMethod.toLowerCase().includes('efectivo') ? 'cash' : 'card') as any,
                address: `${args.deliveryAddress} (${args.neighborhood})`,
                note: args.notes || ''
              });

              if (savedOrder?.id) {
                try {
                  localStorage.setItem('lastOrderId', savedOrder.id);
                } catch (e) {}
              }

              // Lucky Wheel Check
              let wheelMessage = "";
              try {
                const wheelData = await db.getWheelConfig(restaurant.id);
                if (wheelData && wheelData.isActive && total >= wheelData.minOrderAmount) {
                  localStorage.setItem('pendingWheelSpin', JSON.stringify({
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    total,
                    segments: wheelData.segments,
                    countdown: 30,
                    spinDuration: 3,
                    timestamp: Date.now()
                  }));
                  wheelMessage = "\n\n🎁 ¡Noticia Increíble! Tu compra superó el monto mínimo y te has ganado un GIRO GRATIS en la ruleta de premios SmartBite del restaurante. ¡Aparecerá en un momento, muchísima suerte!";
                }
              } catch (wheelError) {
                console.error("Error checking wheel config via IA:", wheelError);
              }

              const guestRecommendation = isGuest
                ? "\n\n💡 *Recomendación Especial*: Has realizado tu compra en modo invitado sin necesidad de actualizar datos ni perfiles. ¡Te recomendamos registrarte en la aplicación para tus próximos pedidos! Al registrarte podrás desbloquear descuentos de la ruleta de premios, participar en nuestro programa de referidos para ganar comisiones y premios, y acceder a todos los programas y promociones exclusivas de nuestros restaurantes aliados."
                : "";

              return { text: `✅ ¡PEDIDO ENVIADO EXITOSAMENTE! El restaurante ya ha recibido tu orden y está en camino. Tu número de pedido es #${savedOrder?.id ? savedOrder.id.slice(-6).toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase()}. ¡Gracias por pedir en ${restaurant.name}!${wheelMessage}${guestRecommendation}` };
            } catch (err) {
              console.error("Error saving order via AI:", err);
            }
          }
          return { text: `He intentado enviar tu pedido al panel, pero hubo un inconveniente. Por favor, asegúrate de tener productos en tu carrito.` };
        }
      }
    }

    return { text: responseText || "Lo siento, no entendí bien. ¿Puedes repetir?" };

  } catch (error) {
    console.error("Error calling Gemini API proxy:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('quota') || errorMsg.includes('429')) {
      return { text: "Lo siento, he alcanzado mi límite de mensajes por ahora. Por favor, intenta de nuevo en un minuto." };
    }
    return { text: "Lo siento, estoy teniendo problemas técnicos en este momento. Por favor, intenta de nuevo más tarde." };
  }
}

export async function suggestMenuImprovements(productName: string, description: string): Promise<string> {
   try {
     const res = await fetch("/api/ai/chat", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         contents: [{
           role: 'user',
           parts: [{ text: `Mejora la siguiente descripción de un producto de restaurante para que sea más apetitosa y vendedora.
           Producto: ${productName}
           Descripción original: ${description}
           
           Devuelve SOLO la descripción mejorada, sin texto adicional.` }]
         }],
       })
     });
     
     if (!res.ok) return description;
     const response = await res.json();
     return response.candidates?.[0]?.content?.parts?.[0]?.text || description;
   } catch (e) {
     return description;
   }
}

export async function generateAITrainingText(fieldId: string, restaurantName: string, restaurantType: string, currentContext: string): Promise<string> {
  const prompts: Record<string, string> = {
    instructions: `Escribe instrucciones generales para una IA que actúa como mesero virtual del restaurante "${restaurantName}" (tipo: ${restaurantType}). Las instrucciones deben decirle a la IA cómo saludar, qué tono usar (amable, vendedor, servicial) y cómo comportarse con el cliente.`,
    openingHours: `Escribe un texto claro y estructurado sobre los horarios de apertura típicos para un restaurante llamado "${restaurantName}". Incluye apertura, cierre y días de descanso opcionales.`,
    allergens: `Redacta un aviso sobre alérgenos e información dietética (sin gluten, opciones veganas, contaminación cruzada) adaptado para el restaurante "${restaurantName}" (tipo: ${restaurantType}).`,
    popularDishes: `Genera una lista breve y apetitosa de 3 posibles platos preferidos (best-sellers) para un restaurante llamado "${restaurantName}" que ofrece comida de tipo "${restaurantType}", para sugerirlos a los clientes.`,
    peakHours: `Escribe una breve advertencia amigable sobre las horas pico típicas de un restaurante de tipo "${restaurantType}", indicando cuándo hay más afluencia de gente para manejar el tiempo de espera.`,
    foodTypes: `Describe de 2 a 3 tipos de comida o especialidades que destacarían en un restaurante de tipo "${restaurantType}" llamado "${restaurantName}".`,
    promotions: `Inventa 2 promociones muy atractivas (ej. 2x1, descuento por primer pedido) que podría ofrecer el restaurante "${restaurantName}" para aumentar ventas a través de la IA.`,
    coupons: `Genera un breve texto invitando a usar cupones, con 2 códigos de ejemplo (ej. BIENVENIDO10) para el restaurante "${restaurantName}".`
  };

  const basePrompt = prompts[fieldId] || `Escribe información relevante para el restaurante "${restaurantName}" sobre: ${fieldId}.`;
  const contextAddition = currentContext && currentContext.trim().length > 0
    ? `\n\nTen en cuenta esta información previa que el usuario ya había ingresado:\n"${currentContext}"`
    : "";

  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: basePrompt + contextAddition + `\n\nResponde SOLO con el texto generado, de forma persuasiva y conversacional (máximo 400 caracteres).` }]
        }],
      })
    });
    
    if (!res.ok) throw new Error("Fallo al generar texto");
    const response = await res.json();
    return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    console.error("Error generating AI text:", error);
    throw new Error('No se pudo generar el texto con IA.');
  }
}
