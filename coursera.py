def func(arr):
	if len(arr) == 0:
		return 0
	swaps = 0
	distance = 0
	for i in range(0, len(arr)):
		if arr[i] == 1:
			continue
		elif arr[i] == 0:
			distance = 1
			for k in range(i + 1, len(arr)):
				if arr[k] == 1:
					for x in range(k, i, -1):
						arr[x] = 0
						arr[x - 1] = 1
						swaps += 1
					i += distance - 1
					break
				else:
					distance += 1

	return swaps

arr = [1, 0, 1, 0, 0, 0, 0, 1]

swaps = func(arr)
print swaps
# 1 0 1 0 0 0 0 1