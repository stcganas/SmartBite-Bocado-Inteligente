import { Restaurant } from "../store/db";

export function calculateRestaurantMeritScore(
  restaurant: Restaurant,
  reviewsCount = 0,
  averageRating = 0,
  driversCount = 0,
  subscriptionActive = false
): { score: number; level: number; xp: number } {
  let score = 0;

  // Profile completeness
  if (restaurant.description && restaurant.description.length > 20) score += 10;
  if (restaurant.logo && !restaurant.logo.includes("placeholder")) score += 15;
  if (restaurant.coverImage && !restaurant.coverImage.includes("placeholder")) score += 15;
  if (restaurant.address) score += 10;
  if (restaurant.phone) score += 10;
  if (restaurant.whatsappNumber) score += 5;
  if (restaurant.facebookUrl) score += 10;
  if (restaurant.instagramUrl) score += 10;
  if (restaurant.detailedHours || restaurant.openingHours) score += 5;

  // Menu size
  const menuParams = restaurant.menu || [];
  score += Math.min(menuParams.length * 5, 50); // Max 50 points for menu items

  // Features (Merit for using the platform)
  if (restaurant.gamificationEnabled) score += 30;
  if (restaurant.luckyWheelEnabled) score += 30;
  if (restaurant.loyaltyEnabled) score += 20;
  if (restaurant.generalDiscountEnabled) score += 20; 
  if (restaurant.anniversaryProgramEnabled) score += 20; 
  
  if (driversCount > 0) score += 30;
  if (restaurant.tables && restaurant.tables.length > 0) score += 30;
  
  if (restaurant.aiKnowledge && Object.values(restaurant.aiKnowledge).some(v => v && v.length > 10)) {
    score += 40;
  }
  
  if (restaurant.aiKnowledge?.marketingHistory && restaurant.aiKnowledge.marketingHistory.length > 0) {
    score += 30;
  }

  if (restaurant.banners && restaurant.banners.length > 0) {
    score += 20;
  }

  // Payment Gateways
  if (restaurant.paymentGateways?.transfer?.active && restaurant.paymentGateways?.cardTerminal?.active) {
    score += 40;
  }

  // Active Subscription
  if (subscriptionActive) score += 50;

  if (restaurant.isFeatured) score += 10; // Paid promotion gives an edge, but shouldn't be the only factor

  // Performance (Reviews) - Max 30 points
  if (reviewsCount > 5) score += 10;
  if (reviewsCount > 20) score += 10;
  if (averageRating >= 4.0) score += 5;
  if (averageRating >= 4.5) score += 5;

  // Calculate Level (1 to 5+)
  let level = 1;
  // Thresholds for levels (Increased to reflect new total possible XP around ~500s)
  if (score >= 80) level = 2;   // Was 60
  if (score >= 180) level = 3;  // Was 120
  if (score >= 300) level = 4;  // Was 200
  if (score >= 450) level = 5;  // Was 350

  return { score, level, xp: score };
}
