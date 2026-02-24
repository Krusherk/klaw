import { AdminStoryDetail } from "@/components/admin/admin-story-detail";

interface StoryDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StoryDetailPage({ params }: StoryDetailPageProps) {
  const { id } = await params;
  return <AdminStoryDetail storyId={id} />;
}
