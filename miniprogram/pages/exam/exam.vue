<template>
  <view class="page">
    <!-- Category Tabs -->
    <view class="category-tabs">
      <view
        v-for="cat in categories"
        :key="cat.value"
        :class="['tab', { active: activeCategory === cat.value }]"
        @click="activeCategory = cat.value"
      >
        <text>{{ cat.label }}</text>
      </view>
    </view>

    <!-- Search -->
    <view class="search-row px-32 py-16">
      <view class="input flex flex-center gap-12" style="height: 72rpx">
        <text>🔍</text>
        <input
          v-model="searchText"
          class="flex-1"
          :placeholder="$t('common.search')"
          @confirm="doSearch"
        />
      </view>
    </view>

    <!-- Exam Tree / Search Results -->
    <scroll-view scroll-y class="exam-content">
      <view v-if="searchResults.length > 0">
        <view
          v-for="exam in searchResults"
          :key="exam.id"
          class="exam-row"
          @click="selectExam(exam)"
        >
          <text>{{ exam.name }}</text>
          <text class="text-hint text-sm" v-if="exam.nameEn">{{ exam.nameEn }}</text>
        </view>
      </view>

      <view v-else-if="examTree.length > 0">
        <view
          v-for="exam in examTree"
          :key="exam.id"
          class="exam-group"
        >
          <view class="exam-parent" @click="toggleChildren(exam.id)">
            <text class="text-bold">{{ exam.name }}</text>
            <text class="text-hint">{{ expandedIds.has(exam.id) ? '▾' : '▸' }}</text>
          </view>
          <view v-if="expandedIds.has(exam.id)" class="exam-children">
            <view
              v-for="child in exam.children || []"
              :key="child.id"
              class="exam-child"
              @click="selectExam(child)"
            >
              <text>{{ child.name }}</text>
              <text class="text-primary">+ {{ $t('common.add') }}</text>
            </view>
          </view>
        </view>
      </view>

      <Empty v-if="!searchResults.length && !examTree.length && !loading" :text="$t('common.noData')" />
    </scroll-view>

    <!-- Selected Exam Setup Modal -->
    <view class="modal-overlay" v-if="selectedExam" @click="selectedExam = null">
      <view class="modal-card" @click.stop>
        <text class="text-lg text-bold">{{ $t('exam.setupExam') }}</text>
        <text class="text-sm text-secondary mt-8">{{ selectedExam.name }}</text>

        <view class="mt-24">
          <text class="text-bold">{{ $t('exam.targetScore') }}</text>
          <input v-model="setupForm.targetScore" class="input mt-8" :placeholder="$t('exam.targetScorePlaceholder')" />
        </view>
        <view class="mt-16">
          <text class="text-bold">{{ $t('exam.targetOrg') }}</text>
          <input v-model="setupForm.targetOrg" class="input mt-8" :placeholder="$t('exam.targetOrgPlaceholder')" />
        </view>
        <view class="mt-16">
          <text class="text-bold">{{ $t('exam.major') }}</text>
          <input v-model="setupForm.major" class="input mt-8" :placeholder="$t('exam.majorPlaceholder')" />
        </view>
        <view class="mt-16">
          <text class="text-bold">{{ $t('exam.dailyHours') }}</text>
          <view class="hours-select mt-8 flex gap-12">
            <view
              v-for="h in [1,2,3,4,6,8,10]"
              :key="h"
              :class="['hours-chip', { active: setupForm.dailyHours === h }]"
              @click="setupForm.dailyHours = h"
            >
              {{ h }}h
            </view>
          </view>
        </view>

        <button class="btn btn-primary btn-block mt-32" @click="confirmAddExam">
          {{ $t('exam.addExam') }}
        </button>
        <button class="btn btn-ghost btn-block mt-12" @click="selectedExam = null">
          {{ $t('common.cancel') }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { examApi, userApi } from '../../api';

const { t } = useI18n();

const categories = [
  { value: 'POSTGRADUATE', label: t('exam.postgraduate') },
  { value: 'CERTIFICATE', label: t('exam.certificate') },
  { value: 'PROFICIENCY', label: t('exam.proficiency') },
];

const activeCategory = ref('POSTGRADUATE');
const searchText = ref('');
const searchResults = ref<any[]>([]);
const examTree = ref<any[]>([]);
const expandedIds = ref(new Set<string>());
const loading = ref(false);
const selectedExam = ref<any>(null);
const setupForm = ref({ targetScore: '', targetOrg: '', major: '', dailyHours: 4 });

onMounted(() => loadExams());
watch(activeCategory, () => loadExams());

function loadExams() {
  loading.value = true;
  examApi.getExams({ category: activeCategory.value }).then((data: any) => {
    examTree.value = data || [];
    // Auto-expand first level
    data?.forEach((e: any) => expandedIds.value.add(e.id));
  }).finally(() => { loading.value = false; });
}

function doSearch() {
  if (!searchText.value.trim()) {
    searchResults.value = [];
    return;
  }
  examApi.searchExams(searchText.value.trim()).then((data: any) => {
    searchResults.value = data || [];
  });
}

function toggleChildren(id: string) {
  if (expandedIds.value.has(id)) expandedIds.value.delete(id);
  else expandedIds.value.add(id);
}

function selectExam(exam: any) {
  selectedExam.value = exam;
  setupForm.value = { targetScore: '', targetOrg: '', major: '', dailyHours: 4 };
}

async function confirmAddExam() {
  try {
    await userApi.addExam({
      examId: selectedExam.value.id,
      ...setupForm.value,
      isPrimary: true,
    });
    uni.showToast({ title: t('exam.added'), icon: 'success' });
    selectedExam.value = null;
    setTimeout(() => uni.navigateBack(), 500);
  } catch (err: any) {
    uni.showToast({ title: err.message, icon: 'none' });
  }
}
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; height: 100vh; }
.category-tabs { display: flex; background: #fff; }
.tab { flex: 1; text-align: center; padding: 24rpx 0; font-size: 28rpx; color: #999; border-bottom: 3rpx solid transparent; }
.tab.active { color: #4A90D9; border-bottom-color: #4A90D9; font-weight: 500; }
.search-row { background: #F5F5F5; }
.exam-content { flex: 1; padding: 0 32rpx; }
.exam-row, .exam-parent, .exam-child { padding: 24rpx 0; border-bottom: 1rpx solid #F0F0F0; display: flex; justify-content: space-between; align-items: center; }
.exam-parent { border-bottom: 2rpx solid #E8E8E8; }
.exam-child { padding-left: 32rpx; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; z-index: 1000; }
.modal-card { background: #fff; border-radius: 32rpx 32rpx 0 0; padding: 48rpx 32rpx; width: 100%; max-height: 80vh; overflow-y: auto; }
.hours-select { flex-wrap: wrap; }
.hours-chip { padding: 12rpx 32rpx; border: 2rpx solid #E8E8E8; border-radius: 20rpx; font-size: 26rpx; }
.hours-chip.active { border-color: #4A90D9; background: rgba(74,144,217,0.05); color: #4A90D9; }
</style>
