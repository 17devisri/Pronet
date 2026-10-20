from django.core.management.base import BaseCommand
from api.models import Project

class Command(BaseCommand):
    help = 'Removes default sample mock projects (p1 to p6) from the database'

    def handle(self, *args, **options):
        mock_ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
        projects_to_delete = Project.objects.filter(id__in=mock_ids)
        count = projects_to_delete.count()
        if count > 0:
            deleted_details = projects_to_delete.delete()
            self.stdout.write(self.style.SUCCESS(f"Successfully deleted {count} mock project(s). Details: {deleted_details}"))
        else:
            self.stdout.write(self.style.NOTICE("No mock projects (p1-p6) found to delete."))
