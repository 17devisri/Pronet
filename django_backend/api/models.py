import uuid
from django.db import models
from django.contrib.auth.hashers import make_password, check_password


class User(models.Model):
    user_name = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    title = models.CharField(max_length=255, blank=True, default="Full-Stack Developer")
    bio = models.TextField(blank=True, default="Passionate developer building collaborative tools.")
    location = models.CharField(max_length=150, blank=True, default="Bengaluru, India")
    github_url = models.CharField(max_length=255, blank=True, default="")
    avatar = models.CharField(max_length=500, blank=True, default="")
    skills = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.user_name


class TechStack(models.Model):
    skill_name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'techstack'

    def __str__(self):
        return self.skill_name


def generate_project_id():
    return f"p_{uuid.uuid4().hex[:8]}"


class Project(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_project_id)
    title = models.CharField(max_length=255)
    tagline = models.CharField(max_length=350, blank=True, default="")
    description = models.TextField(blank=True, default="")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_projects', db_column='owner_id')
    roles_needed = models.JSONField(default=list, blank=True)
    comments = models.JSONField(default=list, blank=True)
    github = models.CharField(max_length=255, blank=True, default="")
    stars = models.IntegerField(default=0)
    forks = models.IntegerField(default=0)
    liked_by = models.JSONField(default=list, blank=True)
    forked_by = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class ProjectTechStack(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tech_associations', db_column='project_id')
    tech = models.ForeignKey(TechStack, on_delete=models.CASCADE, related_name='project_associations', db_column='tech_id')

    class Meta:
        db_table = 'project_ts'
        unique_together = ('project', 'tech')

    def __str__(self):
        return f"{self.project.title} - {self.tech.skill_name}"


class Contributor(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='contributers', db_column='project_id')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contributions', db_column='user_id')
    role = models.CharField(max_length=100, default='Contributor')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'contributers'
        unique_together = ('project', 'user')

    def __str__(self):
        return f"{self.user.user_name} in {self.project.title}"


class Request(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='requests', db_column='project_id')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests', db_column='user_id')
    message = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Request by {self.user.user_name} for {self.project.title} ({self.status})"


class Connection(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('connected', 'Connected'),
        ('declined', 'Declined'),
    )
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='connections_initiated', db_column='user1_id')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='connections_received', db_column='user2_id')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    messages = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'connections'
        unique_together = ('user1', 'user2')

    def __str__(self):
        return f"{self.user1.user_name} -> {self.user2.user_name} ({self.status})"
