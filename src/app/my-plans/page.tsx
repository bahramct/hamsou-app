'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Home,
  Plus,
  Trash2,
  Edit,
  Target,
  Calendar,
  TrendingUp,
  Pause,
  Play,
  Archive,
  LogOut,
} from 'lucide-react';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';
import { authApiGet, authApiPost, authApiPatch, authApiDelete, getToken, setToken, setUser } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { toPersianNumber } from '@/lib/utils/persian';

interface Plan {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  startDate: string;
  endDate: string | null;
  targetDays: number | null;
  currentDays: number;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyPlansPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'daily',
    category: 'personal',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    targetDays: '',
    priority: 'medium',
  });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    loadPlans();
  }, [router]);

  const loadPlans = async () => {
    try {
      const data = await authApiGet<Plan[]>('/api/plans');
      setPlans(data);
    } catch (error: any) {
      console.error('Error loading plans:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در دریافت برنامه‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = await authApiPost('/api/plans', {
        ...formData,
        targetDays: formData.targetDays ? parseInt(formData.targetDays) : null,
        endDate: formData.endDate || null,
      });

      setPlans([data, ...plans]);
      setShowCreateDialog(false);
      resetForm();

      toast({
        title: 'موفق',
        description: 'برنامه جدید با موفقیت ایجاد شد',
      });
    } catch (error: any) {
      console.error('Error creating plan:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ایجاد برنامه',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setSubmitting(true);

    try {
      const data = await authApiPatch(`/api/plans/${editingPlan.id}`, {
        ...formData,
        targetDays: formData.targetDays ? parseInt(formData.targetDays) : null,
        endDate: formData.endDate || null,
      });

      setPlans(plans.map((p) => (p.id === editingPlan.id ? data : p)));
      setEditingPlan(null);
      setShowCreateDialog(false);
      resetForm();

      toast({
        title: 'موفق',
        description: 'برنامه با موفقیت ویرایش شد',
      });
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ویرایش برنامه',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('آیا از حذف این برنامه مطمئن هستید؟')) return;

    try {
      await authApiDelete(`/api/plans/${planId}`);
      setPlans(plans.filter((p) => p.id !== planId));

      toast({
        title: 'موفق',
        description: 'برنامه با موفقیت حذف شد',
      });
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف برنامه',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (planId: string, newStatus: string) => {
    try {
      const data = await authApiPatch(`/api/plans/${planId}`, { status: newStatus });
      setPlans(plans.map((p) => (p.id === planId ? data : p)));

      toast({
        title: 'موفق',
        description: 'وضعیت برنامه تغییر کرد',
      });
    } catch (error: any) {
      console.error('Error changing plan status:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در تغییر وضعیت',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || '',
      type: plan.type,
      category: plan.category,
      startDate: plan.startDate.split('T')[0],
      endDate: plan.endDate ? plan.endDate.split('T')[0] : '',
      targetDays: plan.targetDays?.toString() || '',
      priority: plan.priority,
    });
    setShowCreateDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'daily',
      category: 'personal',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      targetDays: '',
      priority: 'medium',
    });
    setEditingPlan(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      active: { label: 'فعال', variant: 'default' },
      paused: { label: 'متوقف', variant: 'secondary' },
      completed: { label: 'تکمیل شده', variant: 'default' },
      archived: { label: 'بایگانی شده', variant: 'secondary' },
    };
    const s = statusMap[status] || statusMap.active;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; color: string }> = {
      low: { label: 'کم', color: 'bg-gray-500' },
      medium: { label: 'متوسط', color: 'bg-blue-500' },
      high: { label: 'زیاد', color: 'bg-red-500' },
    };
    const p = priorityMap[priority] || priorityMap.medium;
    return (
      <Badge className={`${p.color} text-white`}>
        {p.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      daily: 'روزانه',
      weekly: 'هفتگی',
      monthly: 'ماهانه',
      custom: 'سفارشی',
    };
    return typeMap[type] || type;
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      personal: 'شخصی',
      work: 'کاری',
      health: 'سلامتی',
      learning: 'یادگیری',
      other: 'سایر',
    };
    return categoryMap[category] || category;
  };

  const getProgressPercentage = (plan: Plan) => {
    if (!plan.targetDays || plan.targetDays === 0) return 0;
    return Math.min((plan.currentDays / plan.targetDays) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fa-IR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">برنامه‌ریزی‌ها</h1>
              <p className="text-xs text-gray-500 mt-1">مدیریت اهداف و برنامه‌های خود</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={showCreateDialog} onOpenChange={(open) => {
              setShowCreateDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gray-900 hover:bg-gray-800">
                  <Plus className="w-4 h-4 ml-2" />
                  برنامه جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'ویرایش برنامه' : 'ایجاد برنامه جدید'}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan ? 'اطلاعات برنامه را ویرایش کنید' : 'یک برنامه جدید برای خودتان ایجاد کنید'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan} className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان برنامه *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثلاً: 30 روز ورزش مداوم"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">توضیحات</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="توضیحات بیشتر درباره این برنامه..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">نوع برنامه *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">روزانه</SelectItem>
                        <SelectItem value="weekly">هفتگی</SelectItem>
                        <SelectItem value="monthly">ماهانه</SelectItem>
                        <SelectItem value="custom">سفارشی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">دسته‌بندی</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">شخصی</SelectItem>
                        <SelectItem value="work">کاری</SelectItem>
                        <SelectItem value="health">سلامتی</SelectItem>
                        <SelectItem value="learning">یادگیری</SelectItem>
                        <SelectItem value="other">سایر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">تاریخ شروع *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">تاریخ پایان</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetDays">تعداد روز هدف</Label>
                    <Input
                      id="targetDays"
                      type="number"
                      value={formData.targetDays}
                      onChange={(e) => setFormData({ ...formData, targetDays: e.target.value })}
                      placeholder="مثلاً: 30"
                      min="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">اولویت</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">کم</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">زیاد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                    }}
                  >
                    انصراف
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'در حال ثبت...' : editingPlan ? 'ویرایش' : 'ایجاد'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <NotificationsDropdown />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="خروج"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">کل برنامه‌ها</p>
                <p className="text-2xl font-bold text-gray-900">{toPersianNumber(plans.length)}</p>
              </div>
              <Target className="w-8 h-8 text-gray-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">فعال</p>
                <p className="text-2xl font-bold text-green-600">
                  {toPersianNumber(plans.filter((p) => p.status === 'active').length)}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">تکمیل شده</p>
                <p className="text-2xl font-bold text-blue-600">
                  {toPersianNumber(plans.filter((p) => p.status === 'completed').length)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">متوقف</p>
                <p className="text-2xl font-bold text-orange-600">
                  {toPersianNumber(plans.filter((p) => p.status === 'paused').length)}
                </p>
              </div>
              <Pause className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Plans List */}
        {plans.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">هنوز برنامه‌ای ندارید</h3>
            <p className="text-gray-500 mb-6">
              اولین برنامه خود را ایجاد کنید و مسیر پیشرفت را شروع کنید
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-gray-900 hover:bg-gray-800">
              <Plus className="w-4 h-4 ml-2" />
              ایجاد برنامه جدید
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
                      {getStatusBadge(plan.status)}
                      {getPriorityBadge(plan.priority)}
                    </div>

                    {plan.description && (
                      <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>از {formatDate(plan.startDate)}</span>
                        {plan.endDate && <span>تا {formatDate(plan.endDate)}</span>}
                      </div>
                      <Badge variant="outline">{getTypeLabel(plan.type)}</Badge>
                      <Badge variant="outline">{getCategoryLabel(plan.category)}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {plan.status === 'active' && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleStatusChange(plan.id, 'paused')}
                        title="توقف"
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    )}
                    {plan.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleStatusChange(plan.id, 'active')}
                        title="ادامه"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(plan)}
                      title="ویرایش"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePlan(plan.id)}
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                {plan.targetDays && plan.targetDays > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">پیشرفت</span>
                      <span className="font-semibold text-gray-900">
                        {toPersianNumber(plan.currentDays)} / {toPersianNumber(plan.targetDays)} روز
                        ({toPersianNumber(Math.round(getProgressPercentage(plan)))}٪)
                      </span>
                    </div>
                    <Progress value={getProgressPercentage(plan)} className="h-2" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
