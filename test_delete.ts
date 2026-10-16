import { db } from './src/store/db.ts';

(async () => {
  console.log("Fetching existing settings...");
  const settings = await db.getPlatformSettings();
  console.log("Existing food categories:", settings.foodCategories?.length);
  
  if (settings.foodCategories && settings.foodCategories.length > 0) {
    const toDelete = settings.foodCategories[0].id;
    console.log("Deleting food category:", toDelete);
    
    const newFoodCategories = settings.foodCategories.filter((c: any) => c.id !== toDelete);
    settings.foodCategories = newFoodCategories;
    
    console.log("Calling updatePlatformSettings...");
    const { error } = await db.updatePlatformSettings(settings);
    if (error) {
      console.error("Error updating settings:", error);
    } else {
      console.log("Successfully updated settings.");
      const updatedSettings = await db.getPlatformSettings();
      console.log("Updated food categories length:", updatedSettings.foodCategories?.length);
    }
  }
})();
