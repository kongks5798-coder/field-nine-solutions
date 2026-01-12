/**
 * K-UNIVERSAL Food Delivery Integration
 * Order from any Korean restaurant without language barrier
 */

export interface Restaurant {
  id: string;
  name: string;
  nameEn: string;
  category: 'korean' | 'japanese' | 'chinese' | 'western' | 'cafe';
  rating: number;
  deliveryFee: number;
  minOrder: number;
  estimatedDelivery: number; // minutes
  distance: number; // km
  imageUrl?: string;
  isOpen: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isPopular?: boolean;
}

export interface DeliveryOrder {
  restaurantId: string;
  items: Array<{
    menuId: string;
    quantity: number;
    specialInstructions?: string;
  }>;
  deliveryAddress: {
    address: string;
    detailAddress: string;
    latitude: number;
    longitude: number;
  };
  userId: string;
  paymentMethod: 'ghost_wallet' | 'card';
}

/**
 * Search nearby restaurants
 */
export async function searchRestaurants(params: {
  latitude: number;
  longitude: number;
  category?: string;
  maxDistance?: number; // km
}): Promise<Restaurant[]> {
  // Mock restaurant data (Seoul area)
  const mockRestaurants: Restaurant[] = [
    {
      id: 'rest-1',
      name: '강남 삼겹살',
      nameEn: 'Gangnam BBQ',
      category: 'korean',
      rating: 4.7,
      deliveryFee: 3000,
      minOrder: 15000,
      estimatedDelivery: 35,
      distance: 1.2,
      isOpen: true,
    },
    {
      id: 'rest-2',
      name: '도쿄 라멘',
      nameEn: 'Tokyo Ramen',
      category: 'japanese',
      rating: 4.5,
      deliveryFee: 2500,
      minOrder: 12000,
      estimatedDelivery: 30,
      distance: 0.8,
      isOpen: true,
    },
    {
      id: 'rest-3',
      name: '차이나타운 짜장면',
      nameEn: 'Chinatown Jjajangmyeon',
      category: 'chinese',
      rating: 4.8,
      deliveryFee: 2000,
      minOrder: 10000,
      estimatedDelivery: 25,
      distance: 0.5,
      isOpen: true,
    },
  ];

  // Filter by category if provided
  if (params.category) {
    return mockRestaurants.filter((r) => r.category === params.category);
  }

  return mockRestaurants;
}

/**
 * Get restaurant menu
 */
export async function getMenu(restaurantId: string): Promise<MenuItem[]> {
  // Mock menu data
  const mockMenus: Record<string, MenuItem[]> = {
    'rest-1': [
      {
        id: 'menu-1',
        name: '삼겹살 세트',
        nameEn: 'Pork Belly Set',
        price: 25000,
        description: 'For 2 people',
        isPopular: true,
      },
      {
        id: 'menu-2',
        name: '김치찌개',
        nameEn: 'Kimchi Stew',
        price: 9000,
        isPopular: true,
      },
    ],
    'rest-2': [
      {
        id: 'menu-3',
        name: '돈코츠 라멘',
        nameEn: 'Tonkotsu Ramen',
        price: 12000,
        isPopular: true,
      },
      {
        id: 'menu-4',
        name: '차슈 라멘',
        nameEn: 'Chashu Ramen',
        price: 14000,
      },
    ],
    'rest-3': [
      {
        id: 'menu-5',
        name: '짜장면',
        nameEn: 'Jjajangmyeon',
        price: 7000,
        isPopular: true,
      },
      {
        id: 'menu-6',
        name: '짬뽕',
        nameEn: 'Jjamppong',
        price: 8000,
      },
    ],
  };

  return mockMenus[restaurantId] || [];
}

/**
 * Place delivery order
 */
export async function placeOrder(order: DeliveryOrder): Promise<{
  success: boolean;
  orderId?: string;
  estimatedDelivery?: number;
  totalAmount?: number;
  error?: string;
}> {
  try {
    // Calculate total
    const menu = await getMenu(order.restaurantId);
    let itemsTotal = 0;

    for (const item of order.items) {
      const menuItem = menu.find((m) => m.id === item.menuId);
      if (menuItem) {
        itemsTotal += menuItem.price * item.quantity;
      }
    }

    const restaurants = await searchRestaurants({
      latitude: order.deliveryAddress.latitude,
      longitude: order.deliveryAddress.longitude,
    });

    const restaurant = restaurants.find((r) => r.id === order.restaurantId);
    const deliveryFee = restaurant?.deliveryFee || 3000;
    const totalAmount = itemsTotal + deliveryFee;

    return {
      success: true,
      orderId: `ORDER-${Date.now()}`,
      estimatedDelivery: restaurant?.estimatedDelivery || 35,
      totalAmount,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Order failed',
    };
  }
}
