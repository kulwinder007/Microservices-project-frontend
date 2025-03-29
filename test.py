from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import uuid
import bcrypt
import jwt

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost:5432/taskdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this to a secure secret key in production
app.config['SESSION_DURATION'] = timedelta(minutes=5)  # 5-minute session duration

db = SQLAlchemy(app)

# Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'createdAt': self.created_at.isoformat()
        }

class Session(db.Model):
    __tablename__ = 'sessions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'dueDate': self.due_date.isoformat(),
            'status': self.status,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

# Authentication helper functions
def create_session(user_id):
    # Delete any existing sessions for the user
    Session.query.filter_by(user_id=user_id).delete()
    
    # Create new session
    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + app.config['SESSION_DURATION']
    
    session = Session(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    
    db.session.add(session)
    db.session.commit()
    
    return token

def validate_session(token):
    if not token:
        return None
        
    session = Session.query.filter_by(token=token).first()
    if not session or session.expires_at < datetime.utcnow():
        if session:
            db.session.delete(session)
            db.session.commit()
        return None
        
    return session.user_id

def get_user_from_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
        
    token = auth_header.split(' ')[1]
    return validate_session(token)

# Routes
@app.route('/users', methods=['POST'])
def create_user():
    data = request.json
    
    try:
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
            
        # Hash password
        password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        user = User(
            name=data['name'],
            email=data['email'],
            password_hash=password_hash.decode('utf-8')
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/auth/signin', methods=['POST'])
def signin():
    data = request.json
    
    try:
        user = User.query.filter_by(email=data['email']).first()
        if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401
            
        token = create_session(user.id)
        
        return jsonify({
            'user': user.to_dict(),
            'token': token
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/auth/validate', methods=['GET'])
def validate():
    user_id = get_user_from_token()
    if not user_id:
        return jsonify({'error': 'Invalid or expired session'}), 401
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    return jsonify(user.to_dict())

@app.route('/tasks', methods=['GET'])
def get_tasks():
    user_id = get_user_from_token()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    tasks = Task.query.filter_by(user_id=user_id).all()
    return jsonify([task.to_dict() for task in tasks])

@app.route('/tasks', methods=['POST'])
def create_task():
    user_id = get_user_from_token()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.json
    
    try:
        task = Task(
            title=data['title'],
            description=data['description'],
            due_date=datetime.fromisoformat(data['dueDate'].replace('Z', '+00:00')),
            status='pending',
            user_id=user_id
        )
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify(task.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/tasks/<task_id>', methods=['PATCH'])
def update_task(task_id):
    user_id = get_user_from_token()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404
        
    data = request.json
    
    try:
        if 'status' in data:
            task.status = data['status']
        
        db.session.commit()
        return jsonify(task.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=3000)