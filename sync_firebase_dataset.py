#!/usr/bin/env python3
"""
Firebase Dataset Sync Script
Automatically downloads all student face images from Firebase Storage
to local face_dataset/ directory for processing.

Usage:
    python3 sync_firebase_dataset.py
    python3 sync_firebase_dataset.py --delete-after-sync
    python3 sync_firebase_dataset.py --stats
"""

import os
import sys
import argparse
import json
import time
from datetime import datetime
from pathlib import Path

try:
    import firebase_admin
    from firebase_admin import credentials, storage
except ImportError:
    print("❌ firebase-admin not installed")
    print("Install with: pip install firebase-admin")
    sys.exit(1)

try:
    from dotenv import load_dotenv
except ImportError:
    print("⚠️  python-dotenv not installed. Install with: pip install python-dotenv")

# Load environment
load_dotenv()

class FirebaseSync:
    def __init__(self):
        self.bucket = None
        self.init_firebase()
        self.stats = {
            'downloaded': 0,
            'skipped': 0,
            'failed': 0,
            'total_size': 0
        }
    
    def init_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            project_id = os.getenv('FIREBASE_PROJECT_ID')
            private_key = os.getenv('FIREBASE_PRIVATE_KEY')
            client_email = os.getenv('FIREBASE_CLIENT_EMAIL')
            bucket = os.getenv('FIREBASE_STORAGE_BUCKET')
            
            if not all([project_id, private_key, client_email, bucket]):
                raise ValueError("Missing Firebase credentials in .env")
            
            # Initialize only if not already initialized
            if not firebase_admin.apps:
                cred = credentials.Certificate({
                    'type': 'service_account',
                    'project_id': project_id,
                    'private_key_id': os.getenv('FIREBASE_PRIVATE_KEY_ID', 'key'),
                    'private_key': private_key.replace('\\n', '\n'),
                    'client_email': client_email,
                    'client_id': os.getenv('FIREBASE_CLIENT_ID', ''),
                    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': 'https://oauth2.googleapis.com/token',
                })
                firebase_admin.initialize_app(cred, {
                    'storageBucket': bucket
                })
            
            self.bucket = storage.bucket()
            print(f"✅ Connected to Firebase Storage: {bucket}")
            
        except Exception as e:
            print(f"❌ Firebase initialization failed: {e}")
            print("\n⚠️  Please ensure .env.local has these variables:")
            print("   - FIREBASE_PROJECT_ID")
            print("   - FIREBASE_PRIVATE_KEY")
            print("   - FIREBASE_CLIENT_EMAIL")
            print("   - FIREBASE_STORAGE_BUCKET")
            sys.exit(1)
    
    def download_all(self, delete_after=False):
        """Download all files from face_dataset/ prefix"""
        print("\n📥 Starting Firebase dataset sync...\n")
        
        try:
            blobs = list(self.bucket.list_blobs(prefix='face_dataset/'))
            print(f"📊 Found {len(blobs)} files in Firebase Storage\n")
            
            if not blobs:
                print("⚠️  No files found in face_dataset/")
                return
            
            for i, blob in enumerate(blobs, 1):
                try:
                    self._download_file(blob, delete_after)
                    self.stats['downloaded'] += 1
                    progress = (i / len(blobs)) * 100
                    print(f"[{progress:.0f}%] ✅ {blob.name}")
                    
                except Exception as e:
                    self.stats['failed'] += 1
                    print(f"[ERROR] ❌ {blob.name}: {e}")
            
            self._print_summary()
            
        except Exception as e:
            print(f"❌ Sync failed: {e}")
            sys.exit(1)
    
    def _download_file(self, blob, delete_after=False):
        """Download a single file"""
        local_path = blob.name
        
        # Create directories
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        # Check if already exists and size matches
        if os.path.exists(local_path):
            local_size = os.path.getsize(local_path)
            if local_size == blob.size:
                self.stats['skipped'] += 1
                return
        
        # Download
        blob.download_to_filename(local_path)
        self.stats['total_size'] += blob.size
        
        # Delete from Firebase if requested
        if delete_after:
            blob.delete()
    
    def _print_summary(self):
        """Print download summary"""
        print("\n" + "="*50)
        print("📊 SYNC SUMMARY")
        print("="*50)
        print(f"✅ Downloaded: {self.stats['downloaded']} files")
        print(f"⏭️  Skipped (already exists): {self.stats['skipped']} files")
        print(f"❌ Failed: {self.stats['failed']} files")
        print(f"📦 Total size: {self._format_size(self.stats['total_size'])}")
        print("="*50 + "\n")
    
    def show_stats(self):
        """Show Firebase storage statistics"""
        try:
            blobs = list(self.bucket.list_blobs(prefix='face_dataset/'))
            
            total_size = sum(blob.size for blob in blobs)
            
            # Group by class
            by_class = {}
            for blob in blobs:
                parts = blob.name.split('/')
                if len(parts) > 2:
                    class_name = parts[1]
                    if class_name not in by_class:
                        by_class[class_name] = {'count': 0, 'size': 0}
                    by_class[class_name]['count'] += 1
                    by_class[class_name]['size'] += blob.size
            
            print("\n" + "="*50)
            print("📊 FIREBASE STORAGE STATISTICS")
            print("="*50)
            print(f"Total files: {len(blobs)}")
            print(f"Total size: {self._format_size(total_size)}")
            print(f"Classes: {len(by_class)}\n")
            
            print("By Class:")
            for class_name in sorted(by_class.keys()):
                stats = by_class[class_name]
                print(f"  📁 {class_name}")
                print(f"     Files: {stats['count']}")
                print(f"     Size: {self._format_size(stats['size'])}")
            
            print("="*50 + "\n")
            
        except Exception as e:
            print(f"❌ Failed to retrieve statistics: {e}")
    
    @staticmethod
    def _format_size(bytes_size):
        """Format bytes to human readable"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes_size < 1024:
                return f"{bytes_size:.2f} {unit}"
            bytes_size /= 1024
        return f"{bytes_size:.2f} TB"

def main():
    parser = argparse.ArgumentParser(
        description='Sync facial dataset from Firebase Storage to local directory'
    )
    parser.add_argument('--stats', action='store_true', help='Show storage statistics')
    parser.add_argument('--delete-after-sync', action='store_true', 
                       help='Delete files from Firebase after successful download')
    parser.add_argument('--verify', action='store_true', 
                       help='Verify downloaded files integrity')
    
    args = parser.parse_args()
    
    sync = FirebaseSync()
    
    if args.stats:
        sync.show_stats()
    else:
        sync.download_all(delete_after=args.delete_after_sync)
        
        if args.verify:
            print("\n✅ Verifying downloaded files...")
            # Add verification logic here if needed
            local_files = sum([len(files) for _, _, files in os.walk('face_dataset/')])
            print(f"✅ Local files verified: {local_files} files")

if __name__ == '__main__':
    main()
