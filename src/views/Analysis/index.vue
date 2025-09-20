<template>
    <div class="container">
      <h1 class="page-title">{{ title }}</h1>
      
      <!-- 产品筛选控件 -->
      <div class="filter-controls">
        <div class="filter-group">
          <label for="category-filter">分类:</label>
          <select id="category-filter" v-model="selectedCategory" class="filter-select">
            <option value="all">全部</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="sort-by">排序:</label>
          <select id="sort-by" v-model="sortBy" class="filter-select">
            <option value="name">名称</option>
            <option value="price">价格</option>
            <option value="rating">评分</option>
          </select>
        </div>
      </div>
      
      <!-- 产品卡片网格 -->
      <div class="products-grid">
        <div 
          v-for="product in filteredProducts" 
          :key="product.id" 
          class="product-card"
          :class="{ 'featured': product.featured }"
        >
          <div class="product-image">
            <img :src="product.image" :alt="product.name" />
            <span v-if="product.featured" class="featured-badge">推荐</span>
            <button class="wishlist-btn" @click="toggleWishlist(product.id)">
              ♥
            </button>
          </div>
          
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-description">{{ product.description }}</p>
            
            <div class="product-rating">
              <span class="stars">{{ generateStars(product.rating) }}</span>
              <span class="rating-value">({{ product.rating }})</span>
            </div>
            
            <div class="product-price">
              <span class="current-price">¥{{ product.price.toFixed(2) }}</span>
              <span v-if="product.originalPrice" class="original-price">
                ¥{{ product.originalPrice.toFixed(2) }}
              </span>
              <span v-if="product.discount" class="discount">
                -{{ product.discount }}%
              </span>
            </div>
            
            <div class="product-actions">
              <button class="add-to-cart" @click="addToCart(product)">
                加入购物车
              </button>
              <button class="view-details" @click="viewDetails(product.id)">
                查看详情
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from "vue"
  
  // 定义产品接口
  interface Product {
    id: number
    name: string
    description: string
    price: number
    originalPrice?: number
    discount?: number
    image: string
    category: string
    rating: number
    featured: boolean
  }
  
  // 响应式数据
  const title = ref("产品展示")
  const products = ref<Product[]>([])
  const selectedCategory = ref("all")
  const sortBy = ref("name")
  const wishlist = ref<number[]>([])
  
  // 模拟产品数据
  const mockProducts: Product[] = [
    {
      id: 1,
      name: "高端无线耳机",
      description: "顶级音质，舒适佩戴，长效续航",
      price: 899.99,
      originalPrice: 1099.99,
      discount: 18,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      category: "电子产品",
      rating: 4.5,
      featured: true
    },
    {
      id: 2,
      name: "智能手表",
      description: "健康监测，消息提醒，时尚设计",
      price: 1299.5,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      category: "电子产品",
      rating: 4.2,
      featured: false
    },
    {
      id: 3,
      name: "便携咖啡杯",
      description: "保温保冷，防漏设计，轻便易携",
      price: 199.0,
      originalPrice: 249.0,
      discount: 20,
      image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",
      category: "生活用品",
      rating: 4.7,
      featured: true
    },
    {
      id: 4,
      name: "经典帆布鞋",
      description: "舒适耐穿，百搭款式，多种颜色",
      price: 299.0,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      category: "服装鞋帽",
      rating: 4.3,
      featured: false
    },
    {
      id: 5,
      name: "轻薄笔记本电脑",
      description: "高性能处理器，超长续航，轻薄便携",
      price: 5999.0,
      originalPrice: 6999.0,
      discount: 14,
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
      category: "电子产品",
      rating: 4.8,
      featured: true
    },
    {
      id: 6,
      name: "游戏本",
      description: "高性能处理器，超长续航，轻薄便携",
      price: 1509.0,
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
      category: "电子产品",
      discount: 10,
      rating: 4.8,
      featured: false
    }
  ]
  
  // 计算属性
  const categories = computed(() => {
    const cats = new Set(products.value.map(p => p.category))
    return Array.from(cats)
  })
  
  const filteredProducts = computed(() => {
    let filtered = products.value
    
    // 按分类筛选
    if (selectedCategory.value !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory.value)
    }
    
    // 排序
    filtered = [...filtered].sort((a, b) => {
      if (sortBy.value === "name") {
        return a.name.localeCompare(b.name)
      } else if (sortBy.value === "price") {
        return a.price - b.price
      } else {
        return b.rating - a.rating
      }
    })
    
    return filtered
  })
  
  // 方法
  const generateStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const halfStar = rating % 1 >= 0.5 ? 1 : 0
    const emptyStars = 5 - fullStars - halfStar
    
    return '★'.repeat(fullStars) + '☆'.repeat(halfStar) + '☆'.repeat(emptyStars)
  }
  
  const toggleWishlist = (productId: number) => {
    const index = wishlist.value.indexOf(productId)
    if (index === -1) {
      wishlist.value.push(productId)
    } else {
      wishlist.value.splice(index, 1)
    }
  }
  
  const addToCart = (product: Product) => {
    // 这里可以添加添加到购物车的逻辑
    console.log("添加到购物车:", product.name)
    alert(`已将 ${product.name} 添加到购物车`)
  }
  
  const viewDetails = (productId: number) => {
    // 这里可以添加查看详情的逻辑
    console.log("查看产品详情:", productId)
  }
  
  // 生命周期钩子
  onMounted(() => {
    // 模拟API调用
    setTimeout(() => {
      products.value = mockProducts
    }, 300)
  })
  </script>
  
  <style scoped>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .page-title {
    text-align: center;
    margin-bottom: 30px;
    color: #2c3e50;
    font-size: 2.5rem;
  }
  
  .filter-controls {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 30px;
    flex-wrap: wrap;
  }
  
  .filter-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .filter-select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
  }
  
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 25px;
  }
  
  .product-card {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  
  .product-card.featured {
    border: 2px solid #42b883;
  }
  
  .product-image {
    position: relative;
    height: 200px;
    overflow: hidden;
  }
  
  .product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  
  .product-card:hover .product-image img {
    transform: scale(1.05);
  }
  
  .featured-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: #42b883;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .wishlist-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.8);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    font-size: 1.2rem;
    color: #ccc;
    transition: all 0.3s ease;
  }
  
  .wishlist-btn:hover {
    color: #ff4757;
    background: rgba(255, 255, 255, 0.95);
  }
  
  .product-info {
    padding: 20px;
  }
  
  .product-name {
    font-size: 1.2rem;
    margin-bottom: 10px;
    color: #2c3e50;
  }
  
  .product-description {
    color: #7f8c8d;
    margin-bottom: 15px;
    line-height: 1.4;
  }
  
  .product-rating {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    gap: 8px;
  }
  
  .stars {
    color: #f39c12;
    font-size: 1.1rem;
  }
  
  .rating-value {
    color: #7f8c8d;
    font-size: 0.9rem;
  }
  
  .product-price {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .current-price {
    font-size: 1.4rem;
    font-weight: bold;
    color: #e74c3c;
  }
  
  .original-price {
    text-decoration: line-through;
    color: #95a5a6;
    font-size: 1rem;
  }
  
  .discount {
    background: #ff4757;
    color: white;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .product-actions {
    display: flex;
    gap: 10px;
  }
  
  .add-to-cart, .view-details {
    flex: 1;
    padding: 10px 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s ease;
  }
  
  .add-to-cart {
    background: #42b883;
    color: white;
  }
  
  .add-to-cart:hover {
    background: #359f72;
  }
  
  .view-details {
    background: #f1f2f6;
    color: #2c3e50;
  }
  
  .view-details:hover {
    background: #dfe4ea;
  }
  
  @media (max-width: 768px) {
    .products-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .filter-controls {
      flex-direction: column;
      align-items: center;
    }
  }
  
  @media (max-width: 480px) {
    .products-grid {
      grid-template-columns: 1fr;
    }
    
    .product-actions {
      flex-direction: column;
    }
  }
  </style>