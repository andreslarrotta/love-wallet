import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

export async function POST(request) {
  try {
    const { walletId, amount, product, userName, excludeEmail } = await request.json();

    if (!walletId || !amount || !product || !userName) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1. Get wallet members
    const walletDoc = await adminDb.collection("wallets").doc(walletId).get();
    if (!walletDoc.exists) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const members = walletDoc.data().members || [];
    // Filter out the person who made the expense (optional, usually you don't want to notify yourself)
    const membersToNotify = members.filter(email => email !== excludeEmail);

    if (membersToNotify.length === 0) {
      return NextResponse.json({ success: true, message: "No members to notify" });
    }

    // 2. Get tokens for members
    let tokens = [];
    for (const email of membersToNotify) {
      const userSnapshot = await adminDb.collection("users").where("email", "==", email).get();
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
          tokens = [...tokens, ...userData.fcmTokens];
        }
      }
    }


    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: "No tokens found" });
    }

    // 3. Send notification
    const message = {
      notification: {
        title: "Nuevo Gasto Registrado",
        body: `${userName} registró un gasto de $${amount} en ${product}`,
      },
      tokens: tokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    
    return NextResponse.json({ 
      success: true, 
      successCount: response.successCount, 
      failureCount: response.failureCount 
    });

  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
