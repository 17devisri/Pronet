from django.urls import path, re_path
from . import views

urlpatterns = [
    # Health check & DB test
    path('', views.api_root, name='api_root'),
    re_path(r'^test-db/?$', views.test_db, name='test_db'),

    # Authentication
    re_path(r'^auth/register/?$', views.auth_register, name='auth_register'),
    re_path(r'^auth/login/?$', views.auth_login, name='auth_login'),

    # Users
    re_path(r'^users/(?P<user_name>[^/]+)/contributions/?$', views.user_contributions, name='user_contributions'),
    re_path(r'^users/(?P<user_name>[^/]+)/projects/?$', views.user_projects, name='user_projects'),
    re_path(r'^users/(?P<user_name>[^/]+)/?$', views.user_profile, name='user_profile'),

    # Projects
    re_path(r'^projects/?$', views.projects_list, name='projects_list'),
    re_path(r'^projects/(?P<pk>[^/]+)/comments/?$', views.add_project_comment, name='add_project_comment'),
    re_path(r'^projects/(?P<pk>[^/]+)/interact/?$', views.project_interact, name='project_interact'),
    re_path(r'^projects/(?P<pk>[^/]+)/?$', views.project_detail, name='project_detail'),

    # Collaboration Requests
    re_path(r'^requests/?$', views.collab_requests, name='collab_requests'),
    re_path(r'^requests/(?P<pk>[^/]+)/respond/?$', views.collab_request_respond, name='collab_request_respond'),

    # Connections
    re_path(r'^connections/?$', views.connections_list, name='connections_list'),
    re_path(r'^connections/request/?$', views.connections_list, name='connections_request'),
    re_path(r'^connections/messages/?$', views.connection_messages, name='connection_messages'),
    re_path(r'^connections/(?P<pk>[^/]+)/respond/?$', views.connection_respond, name='connection_respond'),
]
