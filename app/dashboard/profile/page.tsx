'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Save } from 'lucide-react';

interface UserProfile {
  budget_min: number;
  budget_max: number;
  preferred_brands: string[];
  preferred_categories: string[];
  color_preferences: string[];
  price_drop_threshold: number;
  notify_on_sale: boolean;
  notify_on_new_items: boolean;
}

export default function ProfilePage() {
  const { user, loading } = useSession();
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    budget_min: 0,
    budget_max: 1000000,
    preferred_brands: [],
    preferred_categories: [],
    color_preferences: [],
    price_drop_threshold: 20,
    notify_on_sale: true,
    notify_on_new_items: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (!loading && user) {
      fetchProfile();
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('프로필 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (data.success) {
        alert('프로필이 저장되었습니다.');
      } else {
        alert('프로필 저장에 실패했습니다: ' + data.error);
      }
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      alert('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const addBrand = () => {
    if (newBrand.trim() && !profile.preferred_brands?.includes(newBrand.trim())) {
      setProfile({
        ...profile,
        preferred_brands: [...(profile.preferred_brands || []), newBrand.trim()],
      });
      setNewBrand('');
    }
  };

  const removeBrand = (brand: string) => {
    setProfile({
      ...profile,
      preferred_brands: profile.preferred_brands?.filter((b) => b !== brand) || [],
    });
  };

  const addCategory = () => {
    if (newCategory.trim() && !profile.preferred_categories?.includes(newCategory.trim())) {
      setProfile({
        ...profile,
        preferred_categories: [...(profile.preferred_categories || []), newCategory.trim()],
      });
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setProfile({
      ...profile,
      preferred_categories: profile.preferred_categories?.filter((c) => c !== category) || [],
    });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-[#1A1A1A]">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">프로필 설정</h1>
          <p className="text-[#64748B]">AI가 더 정확한 추천을 드릴 수 있도록 정보를 입력해주세요.</p>
        </div>

        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle>예산 설정</CardTitle>
            <CardDescription>선호하는 가격대를 설정하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget_min">최소 예산 (원)</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={profile.budget_min || 0}
                  onChange={(e) =>
                    setProfile({ ...profile, budget_min: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="budget_max">최대 예산 (원)</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={profile.budget_max || 1000000}
                  onChange={(e) =>
                    setProfile({ ...profile, budget_max: parseInt(e.target.value) || 1000000 })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle>선호 브랜드</CardTitle>
            <CardDescription>좋아하는 브랜드를 추가하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="브랜드 이름 입력"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addBrand()}
              />
              <Button onClick={addBrand} variant="outline">
                추가
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.preferred_brands?.map((brand) => (
                <div
                  key={brand}
                  className="flex items-center gap-2 bg-[#F5F5F0] px-3 py-1 rounded-full"
                >
                  <span className="text-sm text-[#1A1A1A]">{brand}</span>
                  <button
                    onClick={() => removeBrand(brand)}
                    className="text-[#64748B] hover:text-[#1A1A1A]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle>선호 카테고리</CardTitle>
            <CardDescription>관심 있는 상품 카테고리를 추가하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="카테고리 입력 (예: 운동화, 의류)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              />
              <Button onClick={addCategory} variant="outline">
                추가
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.preferred_categories?.map((category) => (
                <div
                  key={category}
                  className="flex items-center gap-2 bg-[#F5F5F0] px-3 py-1 rounded-full"
                >
                  <span className="text-sm text-[#1A1A1A]">{category}</span>
                  <button
                    onClick={() => removeCategory(category)}
                    className="text-[#64748B] hover:text-[#1A1A1A]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
            <CardDescription>원하는 알림을 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify_on_sale"
                checked={profile.notify_on_sale || false}
                onCheckedChange={(checked) =>
                  setProfile({ ...profile, notify_on_sale: checked as boolean })
                }
              />
              <Label htmlFor="notify_on_sale" className="cursor-pointer">
                세일 알림 받기
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify_on_new_items"
                checked={profile.notify_on_new_items || false}
                onCheckedChange={(checked) =>
                  setProfile({ ...profile, notify_on_new_items: checked as boolean })
                }
              />
              <Label htmlFor="notify_on_new_items" className="cursor-pointer">
                신상품 알림 받기
              </Label>
            </div>
            <div>
              <Label htmlFor="price_drop_threshold">가격 하락 알림 임계값 (%)</Label>
              <Input
                id="price_drop_threshold"
                type="number"
                value={profile.price_drop_threshold || 20}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    price_drop_threshold: parseInt(e.target.value) || 20,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={saveProfile}
            disabled={isSaving}
            className="bg-[#000000] text-white hover:bg-[#1A1A1A]"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? '저장 중...' : '프로필 저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}
