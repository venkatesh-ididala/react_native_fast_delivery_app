import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import { dummyData } from "./data"; // ✅ FIXED IMPORT

interface Category {
    name: string;
    description: string;
}

interface Customization {
    name: string;
    price: number;
    type: "topping" | "side" | "size" | "crust" | string; // extend as needed
}

interface MenuItem {
    name: string;
    description: string;
    image_url: string;
    price: number;
    rating: number;
    calories: number;
    protein: number;
    category_name: string;
    customizations: string[]; // list of customization names
}

interface DummyData {
    categories: Category[];
    customizations: Customization[];
    menu: MenuItem[];
}

// ensure dummyData has correct shape
const data = dummyData as DummyData;

async function clearAll(collectionId: string): Promise<void> {
    console.log("🧹 Clearing collection", collectionId);
    const list = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId
    );

    await Promise.all(
        list.documents.map((doc) =>
            databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)
        )
    );
}

async function clearStorage(): Promise<void> {
    console.log("🧹 Clearing storage bucket", appwriteConfig.bucketId);
    const list = await storage.listFiles(appwriteConfig.bucketId);

    await Promise.all(
        list.files.map((file) =>
            storage.deleteFile(appwriteConfig.bucketId, file.$id)
        )
    );
}

// async function uploadImageToStorage(imageUrl: string) {
//     console.log("📤 Uploading image:", imageUrl);
//     const response = await fetch(imageUrl);
//     const blob = await response.blob();

//     const fileObj = {
//         name: imageUrl.split("/").pop() || `file-${Date.now()}.jpg`,
//         type: blob.type,
//         size: blob.size,
//         uri: imageUrl,
//     };

//     console.log("📦 File object to upload:", fileObj);

//     const file = await storage.createFile(
//         appwriteConfig.bucketId,
//         ID.unique(),
//         fileObj
//     );

//     const url = storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
//     console.log("✅ Uploaded image URL:", url);

//     return url;
// }

// --- removed uploadImageToStorage() ---

async function seed(): Promise<void> {
    try {
        console.log("🌱 Starting seed process...");
        console.log("📊 Categories:", data.categories);
        console.log("📊 Customizations:", data.customizations);
        console.log("📊 Menu:", data.menu);

        // 1. Clear all
        await clearAll(appwriteConfig.categoriesCollectionId);
        await clearAll(appwriteConfig.customizationsCollectionId);
        await clearAll(appwriteConfig.menuCollectionId);
        await clearAll(appwriteConfig.menuCustomizationsCollectionId);
        await clearStorage();

        // 2. Categories
        const categoryMap: Record<string, string> = {};
        for (const cat of data.categories) {
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.categoriesCollectionId,
                ID.unique(),
                cat
            );
            categoryMap[cat.name] = doc.$id;
        }

        // 3. Customizations
        const customizationMap: Record<string, string> = {};
        for (const cus of data.customizations) {
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.customizationsCollectionId,
                ID.unique(),
                cus
            );
            customizationMap[cus.name] = doc.$id;
        }

        // 4. Menu Items (✅ just save raw image_url, don’t upload)
        for (const item of data.menu) {
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.menuCollectionId,
                ID.unique(),
                {
                    name: item.name,
                    description: item.description,
                    image_url: item.image_url, // keep original URL
                    price: item.price,
                    rating: item.rating,
                    calories: item.calories,
                    protein: item.protein,
                    categories: categoryMap[item.category_name],
                }
            );

            // 5. Menu Customizations
            for (const cusName of item.customizations) {
                await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.menuCustomizationsCollectionId,
                    ID.unique(),
                    {
                        menu: doc.$id,
                        customizations: customizationMap[cusName],
                    }
                );
            }
        }

        console.log("🎉 Seeding complete (without uploading images).");
    } catch (error) {
        console.error("❌ Failed to seed database", error);
    }
}


export default seed;
