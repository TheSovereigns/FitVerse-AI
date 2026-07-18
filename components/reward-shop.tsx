"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import {
  ShoppingBag,
  Zap,
  Palette,
  Clock,
  Dumbbell,
  Headphones,
  User,
  Check,
  Lock,
} from "lucide-react";

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  icon: React.ReactNode;
  category: string;
}

interface PurchaseRecord {
  itemId: string;
  name: string;
  cost: number;
  date: string;
}

interface RewardShopProps {
  isLocked?: boolean;
}

const shopItems: ShopItem[] = [
  {
    id: "theme-dark",
    name: "Midnight Theme",
    cost: 500,
    description: "Exclusive dark theme with custom accents",
    icon: <Palette className="w-5 h-5" />,
    category: "Themes",
  },
  {
    id: "theme-neon",
    name: "Neon Glow Theme",
    cost: 750,
    description: "Vibrant neon color scheme",
    icon: <Palette className="w-5 h-5" />,
    category: "Themes",
  },
  {
    id: "trial-extended",
    name: "Extended Trial",
    cost: 1000,
    description: "7 extra days of premium features",
    icon: <Clock className="w-5 h-5" />,
    category: "Access",
  },
  {
    id: "extra-workouts",
    name: "Extra Workouts",
    cost: 300,
    description: "5 additional workout plans",
    icon: <Dumbbell className="w-5 h-5" />,
    category: "Content",
  },
  {
    id: "priority-support",
    name: "Priority Support",
    cost: 600,
    description: "Skip the queue for support",
    icon: <Headphones className="w-5 h-5" />,
    category: "Services",
  },
  {
    id: "custom-avatar",
    name: "Custom Avatar",
    cost: 400,
    description: "Upload a custom profile avatar",
    icon: <User className="w-5 h-5" />,
    category: "Profile",
  },
];

export function RewardShop({ isLocked = false }: RewardShopProps) {
  const { t } = useTranslation();
  const [userXp, setUserXp] = useState(0);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    try {
      const storedXp = localStorage.getItem("user_xp");
      const storedPurchases = localStorage.getItem("shop_purchases");
      if (storedXp) setUserXp(parseInt(storedXp));
      if (storedPurchases) setPurchases(JSON.parse(storedPurchases));
    } catch {}
  }, []);

  const isPurchased = (id: string) => purchases.some((p) => p.itemId === id);

  const buyItem = (item: ShopItem) => {
    if (userXp < item.cost || isPurchased(item.id)) return;
    const newXp = userXp - item.cost;
    setUserXp(newXp);
    localStorage.setItem("user_xp", newXp.toString());

    const record: PurchaseRecord = {
      itemId: item.id,
      name: item.name,
      cost: item.cost,
      date: new Date().toISOString(),
    };
    const updated = [...purchases, record];
    setPurchases(updated);
    localStorage.setItem("shop_purchases", JSON.stringify(updated));
    setConfirmItem(null);
  };

  const categories = [...new Set(shopItems.map((i) => i.category))];

  if (isLocked) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-foreground font-medium">Premium Feature</p>
            <p className="text-sm text-muted-foreground">Unlock reward shop</p>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">
          <h2 className="text-lg font-semibold text-foreground mb-4">Reward Shop</h2>
          <div className="space-y-2">
            {shopItems.slice(0, 3).map((item) => (
              <div key={item.id} className="p-3 rounded-xl border border-border">
                <p className="text-sm text-foreground">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Reward Shop</h2>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-muted">
          <Zap className="w-4 h-4 text-foreground" />
          <span className="text-sm font-medium text-foreground">{userXp} XP</span>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{category}</h3>
          <div className="space-y-2">
            {shopItems
              .filter((i) => i.category === category)
              .map((item) => {
                const purchased = isPurchased(item.id);
                const canAfford = userXp >= item.cost;
                return (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl border ${
                      purchased ? "border-border bg-muted/50" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${purchased ? "text-muted-foreground" : "text-foreground"}`}>
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="text-right">
                        {purchased ? (
                          <div className="flex items-center gap-1 text-green-500">
                            <Check className="w-4 h-4" />
                            <span className="text-xs">Owned</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => canAfford && setConfirmItem(item)}
                            disabled={!canAfford}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              canAfford
                                ? "bg-foreground text-background hover:opacity-90"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}
                          >
                            {item.cost} XP
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {confirmItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">Confirm Purchase</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Buy {confirmItem.name} for {confirmItem.cost} XP?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => buyItem(confirmItem)}
                  className="flex-1 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium"
                >
                  Buy
                </button>
                <button
                  onClick={() => setConfirmItem(null)}
                  className="flex-1 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {purchases.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showHistory ? "Hide" : "Show"} Purchase History
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1">
              {purchases.slice().reverse().map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>{p.name}</span>
                  <span className="ml-auto">{p.cost} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
