import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const getProductsInCart = await AsyncStorage.getItem('@GoMarketplace');
      if (getProductsInCart) {
        setProducts(JSON.parse(getProductsInCart));
      } else {
        setProducts([]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const findProduct = products.find(cart => cart.id === product.id);
      let state;
      if (!findProduct) {
        state = [
          ...products,
          {
            ...product,
            quantity: 1,
          },
        ];
      } else {
        state = products.map(prod => {
          if (prod.id === product.id) {
            return {
              ...prod,
              quantity: prod.quantity + 1,
            };
          }
          return prod;
        });
      }

      setProducts(state);
      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const state = products.map(prod => {
        if (prod.id === id) {
          return {
            ...prod,
            quantity: prod.quantity + 1,
          };
        }
        return prod;
      });

      setProducts(state);
      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(prod => prod.id === id);

      let state: Product[] = [];

      if (product && product.quantity > 1) {
        state = products.map(prod => {
          if (prod.id === id) {
            return {
              ...prod,
              quantity: prod.quantity - 1,
            };
          }
          return prod;
        });
      } else if (product && product.quantity === 1) {
        state = products.filter(prod => prod.id !== id);
      }

      setProducts(state);
      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
