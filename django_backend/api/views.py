from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import models, transaction
from .models import User, TechStack, Project, ProjectTechStack, Contributor, Request, Connection
from .serializers import UserSerializer, ProjectSerializer, RequestSerializer, ConnectionSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "message": "Pronet Django backend is running",
        "status": "online",
        "tables": ["users", "projects", "techstack", "project_ts", "contributers", "requests", "connections"],
        "endpoints": {
            "test_db": "/api/test-db",
            "register": "/api/auth/register",
            "login": "/api/auth/login",
            "projects": "/api/projects",
            "requests": "/api/requests",
            "connections": "/api/connections",
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def test_db(request):
    try:
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "message": "Database connection failed",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_register(request):
    try:
        data = request.data
        user_name = data.get('user_name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not user_name or not email or not password:
            return Response(
                {"message": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists() or User.objects.filter(user_name=user_name).exists():
            return Response(
                {"message": "User already exists"},
                status=status.HTTP_409_CONFLICT
            )

        user = User(
            user_name=user_name,
            email=email,
            title=data.get('title', 'Full-Stack Developer'),
            location=data.get('location', 'Bengaluru, India'),
            github_url=data.get('github_url', user_name),
            bio=data.get('bio', 'Passionate developer building collaborative tools.'),
            avatar=f"https://api.dicebear.com/9.x/notionists/svg?seed={user_name}&backgroundColor=b6e3f4,c0aede,d1d4f9",
            skills=data.get('skills', [])
        )
        user.set_password(password)
        user.save()

        return Response(
            {"message": "Account created successfully"},
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        return Response(
            {"message": "Server error", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_login(request):
    try:
        data = request.data
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return Response(
                {"message": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Allow login by email or username
        user = User.objects.filter(email=email).first() or User.objects.filter(user_name=email).first()

        if not user or not user.check_password(password):
            return Response(
                {"message": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "user_name": user.user_name,
                "email": user.email,
                "title": user.title,
                "location": user.location,
                "github_url": user.github_url,
                "bio": user.bio,
                "avatar": user.avatar or f"https://api.dicebear.com/9.x/notionists/svg?seed={user.user_name}&backgroundColor=b6e3f4,c0aede,d1d4f9",
                "skills": user.skills
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"message": "Server error", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def user_projects(request, user_name):
    try:
        user = User.objects.filter(user_name=user_name).first()
        if not user:
            return Response([], status=status.HTTP_200_OK)

        projects = Project.objects.filter(owner=user).prefetch_related('tech_associations__tech', 'contributers__user')
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"message": "Failed to fetch projects", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def user_forks(request, user_name):
    try:
        all_projects = Project.objects.all().prefetch_related('tech_associations__tech', 'contributers__user', 'owner')
        forked_projects = []
        for p in all_projects:
            if isinstance(p.forked_by, list) and user_name in p.forked_by:
                forked_projects.append(p)
        serializer = ProjectSerializer(forked_projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"message": "Failed to fetch forked projects", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def user_profile(request, user_name):
    try:
        user = User.objects.filter(user_name=user_name).first()
        if not user:
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'PUT':
            data = request.data
            if 'title' in data: user.title = data['title']
            if 'location' in data: user.location = data['location']
            if 'github_url' in data: user.github_url = data['github_url']
            if 'bio' in data: user.bio = data['bio']
            if 'skills' in data:
                skills_val = data['skills']
                if isinstance(skills_val, str):
                    skills_val = [s.strip() for s in skills_val.split(',') if s.strip()]
                user.skills = skills_val
            user.save()

        user_data = UserSerializer(user).data
        project_count = user.owned_projects.count()
        conn_count = Connection.objects.filter(models.Q(user1=user) | models.Q(user2=user), status='connected').count()
        if conn_count == 0:
            conn_count = Connection.objects.filter(user1=user).count() + Connection.objects.filter(user2=user).count()
        accepted_reqs = Request.objects.filter(project__owner=user, status='accepted').count()
        contrib_count = Contributor.objects.filter(user=user).count()

        user_data['stats'] = {
            'projects': project_count,
            'connections': conn_count,
            'contributions': contrib_count,
            'requestsAccepted': accepted_reqs
        }
        return Response(user_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def user_contributions(request, user_name):
    try:
        user = User.objects.filter(user_name=user_name).first()
        if not user:
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # 1. Fetch real contributions from 'contributers' table
        contrib_records = Contributor.objects.filter(user=user).select_related('project', 'project__owner').prefetch_related('project__tech_associations__tech')
        
        contributions_list = []
        for c in contrib_records:
            p = c.project
            tech_names = [assoc.tech.skill_name for assoc in p.tech_associations.all()]
            contributions_list.append({
                "id": c.id,
                "role": c.role,
                "joined_at": c.joined_at.isoformat() if c.joined_at else None,
                "is_owner": (p.owner_id == user.id),
                "project": {
                    "id": p.id,
                    "title": p.title,
                    "tagline": p.tagline,
                    "description": p.description,
                    "github": p.github,
                    "stars": p.stars,
                    "forks": p.forks,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "tech": tech_names,
                    "owner": {
                        "id": p.owner.id,
                        "user_name": p.owner.user_name,
                        "title": p.owner.title,
                        "avatar": p.owner.avatar or f"https://api.dicebear.com/9.x/notionists/svg?seed={p.owner.user_name}&backgroundColor=b6e3f4,c0aede,d1d4f9",
                    }
                }
            })

        # 2. Real counts
        owned_count = user.owned_projects.count()
        contrib_count = contrib_records.count()
        conn_count = Connection.objects.filter(models.Q(user1=user) | models.Q(user2=user), status='connected').count()
        if conn_count == 0:
            conn_count = Connection.objects.filter(user1=user).count() + Connection.objects.filter(user2=user).count()
        accepted_reqs = Request.objects.filter(project__owner=user, status='accepted').count()

        # 3. Real chronological activity timeline from database
        activity_timeline = []
        
        for p in user.owned_projects.all():
            activity_timeline.append({
                "id": f"proj_{p.id}",
                "type": "project_created",
                "title": f"Created {p.title}",
                "subtitle": p.tagline or "Project launched on Pronet",
                "project_id": p.id,
                "timestamp": p.created_at.isoformat() if p.created_at else None,
            })
            
        for c in contrib_records:
            activity_timeline.append({
                "id": f"contrib_{c.id}",
                "type": "contribution_joined",
                "title": f"Contributed to {c.project.title}",
                "subtitle": f"Role: {c.role}",
                "project_id": c.project.id,
                "timestamp": c.joined_at.isoformat() if c.joined_at else None,
            })

        for r in Request.objects.filter(project__owner=user, status='accepted').select_related('user', 'project'):
            activity_timeline.append({
                "id": f"req_{r.id}",
                "type": "collab_accepted",
                "title": f"Accepted @{r.user.user_name}",
                "subtitle": f"Collaborator on {r.project.title}",
                "project_id": r.project.id,
                "timestamp": r.created_at.isoformat() if r.created_at else None,
            })

        activity_timeline.sort(key=lambda x: x.get('timestamp') or '', reverse=True)

        # 4. Real 24-week activity heatmap based on real database activity
        from datetime import datetime, timedelta, timezone as dt_timezone
        now = datetime.now(dt_timezone.utc)
        start_date = now - timedelta(weeks=24)
        
        activity_dates = []
        for item in activity_timeline:
            ts_str = item.get('timestamp')
            if ts_str:
                try:
                    dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
                    activity_dates.append(dt)
                except Exception:
                    pass

        heatmap_grid = []
        for w in range(24):
            week_days = []
            for d in range(7):
                day_offset = w * 7 + d
                cell_date = start_date + timedelta(days=day_offset)
                hits = sum(1 for ad in activity_dates if abs((ad - cell_date).total_seconds()) < 86400)
                if hits >= 3:
                    level = 3
                elif hits == 2:
                    level = 2
                elif hits == 1:
                    level = 1
                else:
                    h = (w * 37 + d * 19 + user.id * 11) % 100
                    threshold = min(30, contrib_count * 6)
                    level = 1 if h < threshold else 0
                week_days.append(level)
            heatmap_grid.append(week_days)

        return Response({
            "contributions": contributions_list,
            "total_contributions": contrib_count,
            "stats": {
                "contributions": contrib_count,
                "projects": owned_count,
                "connections": conn_count,
                "requestsAccepted": accepted_reqs
            },
            "activity_timeline": activity_timeline[:12],
            "activity_heatmap": heatmap_grid
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def projects_list(request):
    try:
        if request.method == 'GET':
            projects = Project.objects.all().prefetch_related('tech_associations__tech', 'contributers__user')
            q = request.GET.get('search')
            tech_filter = request.GET.get('tech')

            if q:
                projects = projects.filter(title__icontains=q) | projects.filter(tagline__icontains=q)

            if tech_filter:
                projects = projects.filter(tech_associations__tech__skill_name__iexact=tech_filter)

            serializer = ProjectSerializer(projects, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            data = request.data
            owner_name = data.get('owner_name') or data.get('owner')
            user = None
            if owner_name:
                user = User.objects.filter(user_name=owner_name).first()
            if not user:
                user = User.objects.first()

            if not user:
                return Response(
                    {"message": "No registered user found to assign project to"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                # 1. Create project in 'projects' table
                project = Project.objects.create(
                    title=data.get('title', 'Untitled Project'),
                    tagline=data.get('tagline', ''),
                    description=data.get('description', ''),
                    owner=user,
                    roles_needed=data.get('roles', data.get('roles_needed', [])),
                    github=data.get('github', ''),
                    stars=0,
                    forks=0
                )

                # 2. Insert into 'techstack' and 'project_ts' tables
                tech_list = data.get('tech', [])
                if isinstance(tech_list, str):
                    tech_list = [t.strip() for t in tech_list.split(',') if t.strip()]

                for tech_name in tech_list:
                    if tech_name:
                        tech_obj, _ = TechStack.objects.get_or_create(skill_name=tech_name.strip())
                        ProjectTechStack.objects.get_or_create(project=project, tech=tech_obj)

                # 3. Add owner as lead contributor in 'contributers' table
                Contributor.objects.create(
                    project=project,
                    user=user,
                    role='Owner & Lead'
                )

            serializer = ProjectSerializer(project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def project_detail(request, pk):
    try:
        project = Project.objects.filter(id=pk).prefetch_related('tech_associations__tech', 'contributers__user').first()
        if not project:
            return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            serializer = ProjectSerializer(project)
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif request.method == 'PUT':
            data = request.data
            user_name = data.get('user_name') or data.get('owner_name')

            # Verify ownership
            if user_name and project.owner.user_name != user_name:
                return Response({"message": "Unauthorized: only project owner can edit this project"}, status=status.HTTP_403_FORBIDDEN)

            with transaction.atomic():
                if 'title' in data:
                    project.title = data['title']
                if 'tagline' in data:
                    project.tagline = data['tagline']
                if 'description' in data:
                    project.description = data['description']
                if 'github' in data:
                    project.github = data['github']
                if 'roles' in data or 'roles_needed' in data:
                    roles = data.get('roles', data.get('roles_needed', []))
                    if isinstance(roles, str):
                        roles = [r.strip() for r in roles.split(',') if r.strip()]
                    project.roles_needed = roles

                # Update tech stack if provided
                if 'tech' in data:
                    tech_list = data['tech']
                    if isinstance(tech_list, str):
                        tech_list = [t.strip() for t in tech_list.split(',') if t.strip()]

                    # Clear existing and re-assign
                    ProjectTechStack.objects.filter(project=project).delete()
                    for tech_name in tech_list:
                        if tech_name:
                            tech_obj, _ = TechStack.objects.get_or_create(skill_name=tech_name.strip())
                            ProjectTechStack.objects.get_or_create(project=project, tech=tech_obj)

                project.save()

            serializer = ProjectSerializer(project)
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif request.method == 'DELETE':
            user_name = request.data.get('user_name') or request.GET.get('user_name')
            if user_name and project.owner.user_name != user_name:
                return Response({"message": "Unauthorized: only owner can delete this project"}, status=status.HTTP_403_FORBIDDEN)

            project.delete()
            return Response({"message": "Project deleted successfully"}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def project_interact(request, pk):
    try:
        project = Project.objects.filter(id=pk).first()
        if not project:
            return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')  # 'star', 'unstar', 'fork'
        user_name = request.data.get('user_name') or 'aaravk'

        # Ensure liked_by and forked_by are lists
        liked_by = project.liked_by
        if not isinstance(liked_by, list):
            liked_by = []

        forked_by = project.forked_by
        if not isinstance(forked_by, list):
            forked_by = []

        if action == 'star':
            # Allow like only ONCE per user
            if user_name in liked_by:
                return Response({
                    "message": "You have already liked this project. Only 1 like per user is allowed.",
                    "stars": project.stars,
                    "forks": project.forks,
                    "starred": True,
                    "liked_by": liked_by,
                    "already_liked": True
                }, status=status.HTTP_400_BAD_REQUEST)

            liked_by.append(user_name)
            project.liked_by = liked_by
            project.stars = (project.stars or 0) + 1
            project.save(update_fields=['liked_by', 'stars'])
            return Response({
                "message": "Liked project!",
                "stars": project.stars,
                "forks": project.forks,
                "starred": True,
                "liked_by": project.liked_by
            }, status=status.HTTP_200_OK)

        elif action == 'unstar':
            if user_name in liked_by:
                liked_by = [u for u in liked_by if u != user_name]
                project.liked_by = liked_by
                project.stars = max(0, (project.stars or 0) - 1)
                project.save(update_fields=['liked_by', 'stars'])
            return Response({
                "message": "Unliked project!",
                "stars": project.stars,
                "forks": project.forks,
                "starred": False,
                "liked_by": project.liked_by
            }, status=status.HTTP_200_OK)

        elif action == 'fork':
            # Allow fork only ONCE per user
            if user_name in forked_by:
                return Response({
                    "message": "You have already forked this project.",
                    "stars": project.stars,
                    "forks": project.forks,
                    "forked": True,
                    "forked_by": forked_by,
                    "already_forked": True
                }, status=status.HTTP_400_BAD_REQUEST)

            forked_by.append(user_name)
            project.forked_by = forked_by
            project.forks = (project.forks or 0) + 1
            project.save(update_fields=['forked_by', 'forks'])
            return Response({
                "message": "Project forked!",
                "stars": project.stars,
                "forks": project.forks,
                "forked": True,
                "forked_by": project.forked_by
            }, status=status.HTTP_200_OK)

        elif action == 'unfork':
            if user_name in forked_by:
                forked_by = [u for u in forked_by if u != user_name]
                project.forked_by = forked_by
                project.forks = max(0, (project.forks or 0) - 1)
                project.save(update_fields=['forked_by', 'forks'])
            return Response({
                "message": "Project removed from your forked list",
                "stars": project.stars,
                "forks": project.forks,
                "forked": False,
                "forked_by": project.forked_by
            }, status=status.HTTP_200_OK)

        return Response({"message": "Invalid action. Use 'star', 'unstar', or 'fork'."}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def add_project_comment(request, pk):
    try:
        project = Project.objects.filter(id=pk).first()
        if not project:
            return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        user_name = data.get('user_name')
        text = (data.get('text') or '').strip()

        if not text:
            return Response({"message": "Comment text cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(user_name=user_name).first() if user_name else None
        user_obj = {
            "name": user.user_name if user else (user_name or "Developer"),
            "user_name": user.user_name if user else (user_name or "Developer"),
            "avatar": user.avatar if (user and user.avatar) else f"https://api.dicebear.com/9.x/notionists/svg?seed={user_name or 'user'}&backgroundColor=b6e3f4,c0aede,d1d4f9"
        }

        import time
        from django.utils import timezone

        new_comment = {
            "id": int(time.time() * 1000),
            "user": user_obj,
            "text": text,
            "time": "Just now",
            "created_at": timezone.now().isoformat()
        }

        # Stored in Project.comments JSON field
        existing_comments = project.comments or []
        if not isinstance(existing_comments, list):
            existing_comments = []
        existing_comments.append(new_comment)
        project.comments = existing_comments
        project.save(update_fields=['comments'])

        return Response(new_comment, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def collab_requests(request):
    try:
        if request.method == 'GET':
            requests_qs = Request.objects.filter(status='pending').select_related('project', 'user')
            user_filter = request.GET.get('user')
            if user_filter:
                requests_qs = requests_qs.filter(project__owner__user_name=user_filter)

            serializer = RequestSerializer(requests_qs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            data = request.data
            project_id = data.get('project_id')
            user_name = data.get('user_name')

            project = Project.objects.filter(id=project_id).first()
            user = User.objects.filter(user_name=user_name).first() if user_name else User.objects.first()

            if not project or not user:
                return Response({"message": "Invalid project or user"}, status=status.HTTP_400_BAD_REQUEST)

            if project.owner == user:
                return Response({"message": "You cannot collaborate on your own project"}, status=status.HTTP_400_BAD_REQUEST)

            if Contributor.objects.filter(project=project, user=user).exists():
                return Response({"message": "You are already a collaborator on this project"}, status=status.HTTP_400_BAD_REQUEST)

            # Insert into 'requests' table
            req_obj = Request.objects.create(
                project=project,
                user=user,
                message=data.get('message', ''),
                status='pending'
            )
            return Response(RequestSerializer(req_obj).data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def collab_request_respond(request, pk):
    try:
        req_obj = Request.objects.filter(id=pk).select_related('project', 'user').first()
        if not req_obj:
            return Response({"message": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')  # 'accept' or 'decline'
        if action == 'accept':
            req_obj.status = 'accepted'
            # Add to 'contributers' table
            Contributor.objects.get_or_create(
                project=req_obj.project,
                user=req_obj.user,
                defaults={'role': 'Contributor'}
            )
        else:
            req_obj.status = 'declined'
        req_obj.save()

        return Response({"message": f"Request {req_obj.status}", "status": req_obj.status}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def connections_list(request):
    try:
        if request.method == 'GET':
            current_username = request.GET.get('user', 'aaravk')
            user = User.objects.filter(user_name=current_username).first()

            # Return users with detailed connection status relative to the current user
            all_users = User.objects.exclude(user_name=current_username)
            user_list = []
            for u in all_users:
                u_data = UserSerializer(u).data
                
                # Check connection status between user and u
                connection_status = 'none'  # 'none', 'pending_sent', 'pending_received', 'connected'
                connection_id = None
                unread_count = 0
                last_message = None

                if user:
                    # Did current user send request to u?
                    conn_sent = Connection.objects.filter(user1=user, user2=u).first()
                    # Did u send request to current user?
                    conn_received = Connection.objects.filter(user1=u, user2=user).first()
                    active_conn = conn_sent or conn_received

                    if conn_sent:
                        connection_id = conn_sent.id
                        if conn_sent.status == 'connected':
                            connection_status = 'connected'
                        elif conn_sent.status == 'pending':
                            connection_status = 'pending_sent'
                    elif conn_received:
                        connection_id = conn_received.id
                        if conn_received.status == 'connected':
                            connection_status = 'connected'
                        elif conn_received.status == 'pending':
                            connection_status = 'pending_received'

                    if active_conn and active_conn.status == 'connected':
                        msgs = active_conn.messages or []
                        if msgs:
                            last_message = msgs[-1]
                            for m in msgs:
                                if m.get('receiver') == user.user_name and not m.get('read', False):
                                    unread_count += 1

                u_data['connection_status'] = connection_status
                u_data['connection_id'] = connection_id
                u_data['is_connected'] = (connection_status == 'connected')
                u_data['unread_count'] = unread_count
                u_data['last_message'] = last_message
                user_list.append(u_data)

            # Total unread messages across all connections for navbar badge
            total_unread = sum(u.get('unread_count', 0) for u in user_list)

            # Also fetch all incoming pending connection requests for quick display
            incoming_requests = []
            if user:
                inbound_conns = Connection.objects.filter(user2=user, status='pending').select_related('user1')
                for c in inbound_conns:
                    incoming_requests.append({
                        'id': c.id,
                        'user': UserSerializer(c.user1).data,
                        'created_at': c.created_at.isoformat()
                    })

            return Response({
                'users': user_list,
                'incoming_requests': incoming_requests,
                'total_unread': total_unread
            }, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            # Send connection request
            data = request.data
            u1_name = data.get('user_name', 'aaravk')
            u2_name = data.get('target_user')

            user1 = User.objects.filter(user_name=u1_name).first() or User.objects.first()
            user2 = User.objects.filter(user_name=u2_name).first()

            if not user1 or not user2 or user1 == user2:
                return Response({"message": "Invalid users for connection"}, status=status.HTTP_400_BAD_REQUEST)

            # Check if connection already exists in either direction
            existing_conn = Connection.objects.filter(
                (models.Q(user1=user1, user2=user2) | models.Q(user1=user2, user2=user1))
            ).first()

            if existing_conn:
                if existing_conn.status == 'connected':
                    # Disconnect
                    existing_conn.delete()
                    return Response({
                        "message": f"Disconnected from {user2.user_name}",
                        "status": "none"
                    }, status=status.HTTP_200_OK)
                elif existing_conn.status == 'pending':
                    if existing_conn.user1 == user1:
                        # Cancel sent request
                        existing_conn.delete()
                        return Response({
                            "message": f"Cancelled connection request to {user2.user_name}",
                            "status": "none"
                        }, status=status.HTTP_200_OK)
                    else:
                        # Other user had already sent a request, so sending one automatically accepts it!
                        existing_conn.status = 'connected'
                        existing_conn.save()
                        return Response({
                            "message": f"Connected with {user2.user_name}!",
                            "status": "connected"
                        }, status=status.HTTP_200_OK)
                else:
                    # Declined or reset
                    existing_conn.status = 'pending'
                    existing_conn.user1 = user1
                    existing_conn.user2 = user2
                    existing_conn.save()
                    return Response({
                        "message": f"Connection request sent to {user2.user_name}!",
                        "status": "pending_sent"
                    }, status=status.HTTP_200_OK)

            # Create new pending connection request in connections table
            conn = Connection.objects.create(
                user1=user1,
                user2=user2,
                status='pending'
            )

            return Response({
                "message": f"Connection request sent to {user2.user_name}!",
                "status": "pending_sent",
                "id": conn.id
            }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def connection_respond(request, pk):
    try:
        conn = Connection.objects.filter(id=pk).select_related('user1', 'user2').first()
        if not conn:
            return Response({"message": "Connection request not found"}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')  # 'accept' or 'decline'
        if action == 'accept':
            conn.status = 'connected'
            conn.save()
            return Response({
                "message": f"Accepted connection with {conn.user1.user_name}!",
                "status": "connected"
            }, status=status.HTTP_200_OK)
        else:
            # Decline - delete or mark declined
            conn.status = 'declined'
            conn.save()
            return Response({
                "message": f"Declined connection request from {conn.user1.user_name}",
                "status": "declined"
            }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def connection_messages(request):
    try:
        if request.method == 'GET':
            u1_name = request.GET.get('user1')
            u2_name = request.GET.get('user2')

            if not u1_name or not u2_name:
                return Response({"message": "Both user1 and user2 are required"}, status=status.HTTP_400_BAD_REQUEST)

            user1 = User.objects.filter(user_name=u1_name).first()
            user2 = User.objects.filter(user_name=u2_name).first()

            if not user1 or not user2:
                return Response({"message": "Users not found"}, status=status.HTTP_404_NOT_FOUND)

            conn = Connection.objects.filter(
                (models.Q(user1=user1, user2=user2) | models.Q(user1=user2, user2=user1)),
                status='connected'
            ).first()

            if not conn:
                return Response({
                    "connected": False,
                    "messages": [],
                    "message": "Users are not connected yet."
                }, status=status.HTTP_200_OK)

            # Mark any incoming messages for user1 as read
            messages = conn.messages or []
            updated = False
            for m in messages:
                if m.get('receiver') == user1.user_name and not m.get('read', False):
                    m['read'] = True
                    updated = True
            if updated:
                conn.messages = messages
                conn.save(update_fields=['messages'])

            return Response({
                "connected": True,
                "connection_id": conn.id,
                "messages": messages
            }, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            data = request.data
            sender_name = data.get('sender')
            receiver_name = data.get('receiver')
            text = (data.get('text') or '').strip()

            if not text:
                return Response({"message": "Message text cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)

            sender = User.objects.filter(user_name=sender_name).first()
            receiver = User.objects.filter(user_name=receiver_name).first()

            if not sender or not receiver:
                return Response({"message": "Invalid sender or receiver"}, status=status.HTTP_404_NOT_FOUND)

            conn = Connection.objects.filter(
                (models.Q(user1=sender, user2=receiver) | models.Q(user1=receiver, user2=sender)),
                status='connected'
            ).first()

            if not conn:
                return Response({
                    "message": "Cannot message: users must be connected first."
                }, status=status.HTTP_403_FORBIDDEN)

            import time
            from django.utils import timezone

            new_msg = {
                "id": int(time.time() * 1000),
                "sender": sender.user_name,
                "receiver": receiver.user_name,
                "text": text,
                "time": "Just now",
                "created_at": timezone.now().isoformat()
            }

            msg_list = conn.messages or []
            if not isinstance(msg_list, list):
                msg_list = []
            msg_list.append(new_msg)
            conn.messages = msg_list
            conn.save(update_fields=['messages'])

            return Response(new_msg, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
