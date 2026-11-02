"""Teste geométrico com superfícies sintéticas conhecidas, ruído, móveis e orientação inclinada."""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
from structure_plan import extract_structure, align_up
import numpy as np
rng=np.random.default_rng(42)
points=[];normals=[]
for axis,coordinate,span in [(0,0,4),(0,5,4),(2,0,5),(2,4,5)]:
    p=np.zeros((2200,3));p[:,axis]=coordinate+rng.normal(0,.006,2200);p[:,1]=rng.uniform(0,2.8,2200);p[:,2 if axis==0 else 0]=rng.uniform(0,span,2200);n=np.zeros_like(p);n[:,axis]=1;points.extend(p);normals.extend(n)
# Piso e mobiliário não devem virar paredes opostas.
p=rng.uniform([0,0,0],[5,.015,4],(1500,3));n=np.tile([0,1,0],(1500,1));points.extend(p);normals.extend(n)
p=np.array(points);n=np.array(normals)
angle=.48;rotation=np.array([[np.cos(angle),0,-np.sin(angle)],[0,1,0],[np.sin(angle),0,np.cos(angle)]])
tilt=align_up([.12,.98,.06]);p=p@rotation.T@tilt;n=n@rotation.T@tilt;up=np.array([0,1,0])@tilt
result=extract_structure(p,n,up,24)
dimensions=sorted([result['width'],result['depth']]);assert np.allclose(dimensions,[4,5],atol=.12),dimensions
assert result['evidence']['verticalPlanes']==4 and result['requiresReview'] and not result['openingsDetected']
# Dois planos únicos não sustentam um cômodo fechado.
single=np.array(points)[:2200].tolist()+np.array(points)[4400:6600].tolist();sn=np.array(normals)[:2200].tolist()+np.array(normals)[4400:6600].tolist()
try:extract_structure(np.asarray(single),np.asarray(sn),[0,1,0]);raise AssertionError('Paredes ausentes não podem ser inventadas.')
except ValueError:pass
try:extract_structure(np.asarray(points)[:50],np.asarray(normals)[:50],[0,1,0]);raise AssertionError('Faltou recusar amostra insuficiente.')
except ValueError:pass
print('OK — quatro paredes observadas, dimensões sob rotação/ruído, piso ignorado e recusa de estrutura incompleta.')
