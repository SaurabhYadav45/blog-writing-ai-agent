import os
import sys

# Add backend to sys.path
sys.path.append(r"c:\Users\saura\OneDrive\Documents\Desktop\GenAi Projects\Blog Writing AI Agent\backend")

from sqlmodel import Session, select
from app.core.db import engine
from app.models.blog import Blog

with Session(engine) as session:
    stmt = select(Blog).order_by(Blog.id.desc()).limit(1)
    blog = session.exec(stmt).first()
    if blog:
        print("Blog ID:", blog.id)
        print("Topic:", blog.topic)
        print("Status:", blog.status)
        print("Length of Markdown:", len(blog.markdown_content) if blog.markdown_content else 0)
        print("Contains iframe?:", "iframe" in (blog.markdown_content or ""))
        if "iframe" in (blog.markdown_content or ""):
            print("Video showed up in DB")
        else:
            print("Video missing in DB")
    else:
        print("No blogs found")
