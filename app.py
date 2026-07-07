from flask import Flask
from application.database import db
from application.models import User, Role
from application.config import LocalDevelopmentConfig
from application.resources import api
from flask_security import Security, SQLAlchemyUserDatastore,hash_password
from application.celery_init import celery_init_app
from celery.schedules import crontab
from application.tasks import send_performace_report  


def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)



    db.init_app(app)
    api.init_app(app)


    datastore = SQLAlchemyUserDatastore(db,User,Role)
    app.security = Security(app,datastore)
    app.app_context().push()
    return app

app  = create_app()
celery = celery_init_app(app)
celery.autodiscover_tasks()

with app.app_context():
    db.create_all()
    app.security.datastore.find_or_create_role(name = "admin",description = "Superuser")
    app.security.datastore.find_or_create_role(name = "user",description = "General User")
    db.session.commit()

    if not app.security.datastore.find_user(email="admin@gmail.com"):
        app.security.datastore.create_user(email = "admin@gmail.com",
                                           username = "admin",
                                           password = hash_password("admin"),
                                           qualification = "admin",
                                           roles = ['admin'])
    if not app.security.datastore.find_user(email="user1@gmail.com"):
        app.security.datastore.create_user(email = "user1@gmail.com",
                                           username = "user1",
                                           password = hash_password("user1"),
                                           qualification = "user1",
                                           roles = ['user'])
    db.session.commit()

from application.routes import *

@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(minute='*/2'),
        send_performace_report.s(),
    )
if __name__ == '__main__':
    app.run()
