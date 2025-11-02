<template>
  <div class="content">
    <div class="title">
      {{ title }}
      <div class="sum">{{ sum }}</div>
      <button class="btn" @click="sum++">Add</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

const title = ref<string>("Hello World");
const sum = ref<number>(0);

// 页面加载时从localStorage读取保存的值
onMounted(() => {
  const savedSum = localStorage.getItem("sumValue");
  if (savedSum) {
    sum.value = parseInt(savedSum, 10);
  } else {
    sum.value = 100; // 默认值
  }
});

// 监听sum的变化并保存到localStorage
watch(sum, (newValue) => {
  localStorage.setItem("sumValue", newValue.toString());
});
</script>

<style scoped>
.content {
  padding: 20px;
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sum {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.btn {
  padding: 10px 20px;
  background: #41b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn:hover {
  background: #359f72;
}
</style>
