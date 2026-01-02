"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ShoppingBag, Search, Star, ArrowRight, X, Plus, Minus, Trash2, ShieldCheck, Award, Lock, Truck, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

// --- Tipagem dos Dados ---
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

// Dados de exemplo para os produtos
const products: Product[] = [
  {
    id: 1,
    name: "Whey Protein Isolado - BioGen",
    category: "Suplementos",
    price: 289.90,
    rating: 4.9,
    reviews: 124,
    image: "/placeholder.svg?width=300&height=300",
    description: "Proteína de soro de leite isolada de alta pureza, com 25g de proteína por dose. Ideal para recuperação muscular e ganho de massa magra. Zero carboidratos e zero gordura."
  },
  {
    id: 2,
    name: "Creatina Monohidratada Pura",
    category: "Suplementos",
    price: 89.90,
    rating: 5.0,
    reviews: 302,
    image: "/placeholder.svg?width=300&height=300",
    description: "Aumente sua força e performance nos treinos com nossa creatina 100% pura. Auxilia no ganho de massa muscular e melhora a performance em exercícios de alta intensidade."
  },
  {
    id: 3,
    name: "Kit Halteres Ajustáveis 24kg",
    category: "Equipamentos",
    price: 1299.00,
    rating: 4.7,
    reviews: 58,
    image: "/placeholder.svg?width=300&height=300",
    description: "Otimize seu espaço e seus treinos. Um único par de halteres que substitui 15 pares convencionais, com ajuste de peso rápido e seguro."
  },
  {
    id: 4,
    name: "Monitor Cardíaco de Pulso",
    category: "Acessórios",
    price: 450.00,
    rating: 4.8,
    reviews: 99,
    image: "/placeholder.svg?width=300&height=300",
    description: "Monitore sua frequência cardíaca em tempo real, calorias gastas e qualidade do sono. Sincronize com o FitVerse AI para dados ainda mais precisos."
  },
];

// --- Componente do Overlay de Detalhes do Produto ---
function ProductDetailOverlay({ product, onClose, onAddToCart }: { product: Product; onClose: () => void; onAddToCart: (product: Product) => void; }) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-black z-50 animate-in fade-in duration-300">
      <ScrollArea className="h-full">
        <div className="container mx-auto max-w-5xl px-4 py-12">
          {/* Header com botão de voltar */}
          <div className="mb-8">
            <Button variant="ghost" onClick={onClose} className="text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para a Loja
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Coluna de Imagens */}
            <div>
              <div className="aspect-square w-full bg-gray-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-gray-200 dark:border-zinc-800">
                <ShoppingBag className="w-48 h-48 text-gray-300 dark:text-zinc-700" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square bg-gray-100 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-primary cursor-pointer flex items-center justify-center">
                     <ShoppingBag className="w-8 h-8 text-gray-300 dark:text-zinc-700" />
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna de Informações */}
            <div className="flex flex-col">
              <Badge variant="outline" className="border-primary text-primary bg-primary/10 mb-3 w-fit">{product.category}</Badge>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-4">{product.name}</h1>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-400">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-gray-900 dark:text-white text-base">{product.rating}</span>
                  <span className="text-gray-500 dark:text-zinc-500">({product.reviews} avaliações)</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-zinc-400 text-base mb-8 leading-relaxed">{product.description}</p>
              
              <div className="mt-auto space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl">
                  <p className="text-4xl font-black text-primary">R$ {product.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">ou em até 12x sem juros</p>
                </div>
                <Button onClick={() => onAddToCart(product)} className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg">Adicionar ao Carrinho</Button>
              </div>
            </div>
          </div>

          {/* Seção de Certificados */}
          <div className="mt-16 pt-12 border-t border-gray-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">Nossa Garantia de Qualidade</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center"><div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center"><Award className="w-8 h-8 text-primary" /></div><h3 className="font-semibold text-gray-900 dark:text-white">Qualidade Premium</h3><p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">Ingredientes e materiais selecionados para máxima performance.</p></div>
              <div className="text-center"><div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center"><ShieldCheck className="w-8 h-8 text-primary" /></div><h3 className="font-semibold text-gray-900 dark:text-white">Testado e Aprovado</h3><p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">Todos os produtos são rigorosamente testados por atletas.</p></div>
              <div className="text-center"><div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center"><Truck className="w-8 h-8 text-primary" /></div><h3 className="font-semibold text-gray-900 dark:text-white">Entrega Rápida</h3><p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">Receba seus produtos com agilidade e segurança em todo o Brasil.</p></div>
              <div className="text-center"><div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center"><Lock className="w-8 h-8 text-primary" /></div><h3 className="font-semibold text-gray-900 dark:text-white">Compra 100% Segura</h3><p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">Ambiente criptografado para proteger todos os seus dados.</p></div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// --- Componente do Carrinho Lateral ---
function CartSidePanel({ items, isOpen, onClose, onUpdateQuantity, onRemoveItem }: { items: CartItem[]; isOpen: boolean; onClose: () => void; onUpdateQuantity: (productId: number, quantity: number) => void; onRemoveItem: (productId: number) => void; }) {
  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  return (
    <div className={cn("fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-black border-l border-gray-200 dark:border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out", isOpen ? "translate-x-0" : "translate-x-full")}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Carrinho de Compras</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 dark:text-zinc-700 mb-4" />
              <p className="text-gray-500 dark:text-zinc-500">Seu carrinho está vazio.</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-md flex items-center justify-center text-gray-400 dark:text-zinc-600 border border-gray-100 dark:border-transparent">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-sm text-primary font-semibold">R$ {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-7 w-7 bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                  <span className="text-sm font-bold w-4 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7 bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                </div>
                <Button size="icon" variant="ghost" className="text-gray-500 dark:text-zinc-500 hover:text-destructive" onClick={() => onRemoveItem(item.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-zinc-800 space-y-4">
            <div className="flex justify-between text-lg">
              <span className="text-gray-500 dark:text-zinc-400">Total:</span>
              <span className="font-bold text-gray-900 dark:text-white">R$ {totalPrice.toFixed(2)}</span>
            </div>
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)]">Finalizar Compra</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function StoreTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // --- Lógica do Carrinho ---

  const handleAddToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
    setSelectedProduct(null); // Fecha o modal ao adicionar
    setIsCartOpen(true); // Abre o carrinho
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // --- Lógica do Modal ---
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };
  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  // --- Lógica de Filtro ---
  const allCategories = useMemo(() => [...new Set(products.map(p => p.category))], []);

  const handleCategoryChange = (category: string) => {
    // Se a categoria clicada já estiver ativa, desativa (mostra todos). Caso contrário, ativa.
    setActiveCategory(prev => (prev === category ? "" : category));
  };

  const filteredProducts = products.filter(p => {
    const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = activeCategory === "" || p.category === activeCategory;
    return searchMatch && categoryMatch;
  });

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="px-4 md:px-6 pt-8 pb-24 bg-gray-50 dark:bg-black text-gray-600 dark:text-zinc-300 min-h-screen max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black mb-1 text-balance tracking-tighter uppercase italic text-gray-900 dark:text-white">
          Fit<span className="text-primary">Store</span>
        </h1>
          <p className="text-gray-500 dark:text-zinc-500 text-pretty font-medium text-sm">
          Produtos selecionados pela IA para otimizar sua performance.
        </p>
        </div>
        <Button variant="ghost" className="relative" onClick={() => setIsCartOpen(true)}>
          <ShoppingBag className="w-6 h-6 text-gray-500 dark:text-zinc-400" />
          {totalCartItems > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
              {totalCartItems}
            </span>
          )}
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
          <Input
            placeholder="Buscar por suplementos, equipamentos..."
            className="h-12 pl-12 bg-white dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800 rounded-xl focus:border-primary focus:ring-primary/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <ScrollArea className="w-full whitespace-nowrap -mx-4 px-4 mb-8">
        <div className="flex items-center gap-3 pb-2">
          <Button
            variant={activeCategory === "" ? "default" : "outline"}
            onClick={() => setActiveCategory("")}
            className={cn(
              "h-9 rounded-full transition-all",
              activeCategory === "" ? "bg-primary text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]" : "bg-white dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800 hover:border-primary/50 hover:text-primary text-gray-600 dark:text-zinc-300"
            )}
          >
            Todos
          </Button>
          {allCategories.map(category => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => handleCategoryChange(category)}
              className={cn(
                "h-9 rounded-full transition-all whitespace-nowrap",
                activeCategory === category ? "bg-primary text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]" : "bg-white dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800 hover:border-primary/50 hover:text-primary text-gray-600 dark:text-zinc-300"
              )}
            >
              {category}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div 
            key={product.id} 
            className="relative group bg-white dark:bg-zinc-950/50 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 cursor-pointer"
            onClick={() => handleProductClick(product)}
          >
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50 rounded-tl-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/50 rounded-tr-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/50 rounded-bl-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50 rounded-br-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="absolute top-3 right-3 z-10">
              <Badge variant="secondary" className="bg-primary text-primary-foreground">{product.category}</Badge>
            </div>
            <div className="h-48 bg-gray-100 dark:bg-zinc-900 flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-zinc-700" />
            </div>
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-balance leading-tight group-hover:text-primary transition-colors h-10">{product.name}</h3>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-primary">R$ {product.price.toFixed(2)}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-400">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-gray-900 dark:text-white">{product.rating}</span>
                  <span>({product.reviews})</span>
                </div>
              </div>
              <Button 
                className="w-full h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all group/btn font-bold"
                onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
              >
                Adicionar
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Trust & Security Section */}
      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-zinc-800/50 text-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Segurança e Confiança Garantida</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-500 mb-6 max-w-2xl mx-auto">Sua compra é 100% segura. Trabalhamos com as melhores plataformas de pagamento e garantimos a qualidade de nossos produtos com selos de certificação.</p>
        <div className="flex justify-center items-center gap-8 flex-wrap">
          <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">Compra Segura SSL</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
            <Award className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">Produtos Certificados</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
            <Lock className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">Privacidade Protegida</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
            <Truck className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">Entrega Rápida</span>
          </div>
        </div>
      </div>

      {/* Cart Side Panel */}
      <CartSidePanel 
        items={cartItems}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailOverlay 
          product={selectedProduct}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}