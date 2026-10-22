#!/usr/bin/env python3
"""Orient ROLL//99 STLs with a numbered planar face on Z=0 for slicers."""
from pathlib import Path
import math
import numpy as np
import trimesh

root=Path(__file__).resolve().parents[1]
# The normal of the top-hemisphere face centered around the +Y ring vertex.
# Rebuild the same analytic face orientation as generate_d10.py.
r=14.2;c=math.cos(math.pi/5);k=(1+c)/(1-c);h=r/math.sqrt(1-1/k**2);z=h/k
points=[np.array([0.,0.,h]),np.array([0.,0.,-h])]
for i in range(10):
 a=math.pi/2+i*math.pi/5
 points.append(np.array([r*math.cos(a),r*math.sin(a),z if i%2==0 else -z]))
face=[0,2,3,4]; verts=[points[x] for x in face]
n=np.cross(verts[1]-verts[0],verts[2]-verts[0]);n=n/np.linalg.norm(n)
if np.dot(n,sum(verts)/4)<0:n=-n
mat=trimesh.geometry.align_vectors(n,np.array([0.,0.,-1.]))
for role in ('TENS','ONES'):
 inp=root/'models'/f'ROLL99_{role}_d10.stl'
 out=root/'models'/f'ROLL99_{role}_PRINT_ORIENTED.stl'
 mesh=trimesh.load_mesh(inp,process=True)
 mesh.apply_transform(mat)
 mesh.apply_translation([0,0,-mesh.bounds[0,2]])
 assert mesh.is_watertight and mesh.is_winding_consistent and mesh.volume>0
 assert abs(mesh.bounds[0,2])<1e-4
 mesh.export(out)
 print(out.name,'bounds_mm',mesh.extents.round(3).tolist(),'triangles',len(mesh.faces),'watertight',mesh.is_watertight)